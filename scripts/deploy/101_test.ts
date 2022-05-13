
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { CONTRACTS } from '../constants';

import { BashTreasury__factory, DAI__factory, BASHERC20Token__factory, UniswapV2Pair__factory } from '../../types';
import { waitFor } from '../txHelper';
import { Guid } from 'guid-typescript';

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signer = ethers.provider.getSigner(deployer);

    console.log("test-a-101");
    return true;
};

func.id = "test-a";
func.tags = ["test-a"];
export default func;
