interface TronTransferDto {
  amount: number;
  symbol: string;
  from: string;
  txID: string;
  contract?: string;
}

export default TronTransferDto;
