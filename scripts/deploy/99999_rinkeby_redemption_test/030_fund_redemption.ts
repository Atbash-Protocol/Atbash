import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { BASH_STARTING_MARKET_VALUE_IN_DAI, CONTRACTS, INITIAL_BASH_LIQUIDITY_IN_DAI, INITIAL_DAI_RESERVES_AMOUNT } from '../../constants';

import { BashTreasury__factory, DAI__factory, BASHERC20Token__factory, ABASHERC20__factory } from '../../../types';
import { waitFor } from '../../txHelper';
import { BigNumber } from 'ethers';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import '../../extensions';
import { liveNetworkConfirm } from '../../confirm';
import { isNotLocalTestingNetwork } from '../../network';


const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    const bashDeployment = await deployments.get(CONTRACTS.bash);
    const bash = BASHERC20Token__factory.connect(bashDeployment.address, signer);

    // Calculate BASH allocated for redemption (should already be in deployer wallet)
    var presaleDeployment = await deployments.get(CONTRACTS.atbashPresale);
    var abashDeployment = await deployments.get(CONTRACTS.aBash);
    var abash = await ABASHERC20__factory.connect(abashDeployment.address, signer);
    // totalSupply - presale
    var amountForRedeem = (await abash.totalSupply()).sub(await abash.balanceOf(presaleDeployment.address));
    
    // todo: convert amountForRedeem into 9 decimals
    // uint256 bashAmount = amount.mul(10 ** bash.decimals())
    // .div(10 ** abash.decimals());
    // console.log(`Amount BASH for redeem: ${amountForRedeem}`);

    const decimals = await abash.decimals() - await bash.decimals();
    amountForRedeem = amountForRedeem.div(10 ** decimals);
    // amountForRedeem = amountForRedeem.mul(10 ** await bash.decimals())
    //                                     .div(10 ** await abash.decimals());
    // console.log(`Amount BASH for redeem decimal fix: ${amountForRedeem}`);

    const presaleRedemptionDeployment = await deployments.get(CONTRACTS.presaleRedemption);
    await waitFor(bash.approve(deployer, amountForRedeem));
    await waitFor(bash.transferFrom(deployer, presaleRedemptionDeployment.address, amountForRedeem));
    console.log(`Funded ${amountForRedeem.toGweiComma()} BASH to redemption contract`);
    return true;
};

func.skip = async (hre: HardhatRuntimeEnvironment) => isNotLocalTestingNetwork(hre.network);

func.id = "2022-rinkeby-redemption-test-fund-redemption";
func.dependencies = [CONTRACTS.bash, CONTRACTS.aBash, CONTRACTS.atbashPresale, CONTRACTS.presaleRedemption];
func.tags = ["RedemptionTesting", func.id];

export default func;
