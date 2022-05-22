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

declare module 'ethers' {
    export interface BigNumber {
        toEther(): string;
        toEtherComma(): string;
        toGweiComma(): string;
        toComma(): string,
    }
}

(BigNumber as any).prototype.toEther = function(): string {
    return formatEther(this as BigNumber);
};

(BigNumber as any).prototype.toEtherComma = function(): string {
    return commify(formatEther(this as BigNumber));
};

(BigNumber as any).prototype.toGweiComma = function(): string {
    return commify(formatUnits(this as BigNumber, 9));
};

(BigNumber as any).prototype.toComma = function(): string {
    return commify((this as BigNumber).toString());
};