import { BigNumber, BigNumberish, ethers, utils } from "ethers";
import { commify, formatEther, formatUnits, parseUnits } from "ethers/lib/utils";

declare global {
    interface String {
        parseUnits(units: BigNumberish): BigNumber;
        toBigNumber(): BigNumber;
        toComma(): string;
    }
}

(String as any).prototype.parseUnits = function(units: BigNumberish): BigNumber {
    return parseUnits(this as string, units);
};

(String as any).prototype.toBigNumber = function(): BigNumber {
    return BigNumber.from(this as string);
};

(String as any).prototype.toComma = function(): string {
    const _self = (this as String).toString();
    return commify(_self);
}
