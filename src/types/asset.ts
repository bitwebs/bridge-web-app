export enum AssetNativeDenomEnum {
  ubkrw = 'ubkrw',
  ubusd = 'ubusd',
  uluna = 'uluna',
  ubsdr = 'ubsdr',
  ubmnt = 'ubmnt',
}

export enum AssetSymbolEnum {
  Luna = 'Luna',
  BUSD = 'BUSD',
  KRT = 'KRT',
  BSDT = 'BSDT',
  BBMNT = 'BBMNT',
  bETH = 'bETH',
}

export type AssetType = {
  symbol: AssetSymbolEnum
  name: string
  logoURI: string
  terraToken: string
  balance?: string
  disabled?: boolean
}

export type WhiteListType = Record<
  string, // terra tokenAddress
  string // tokenAddress
>

export type BalanceListType = Record<
  string, // tokenAddress
  string // balance
>
