import { AssetSymbolEnum, AssetNativeDenomEnum } from 'types/asset'

const TERRA_DECIMAL = 1e6
const ETHER_BASE_DECIMAL = 1e18

const symbolOfDenom: Record<AssetNativeDenomEnum, AssetSymbolEnum> = {
  [AssetNativeDenomEnum.ubkrw]: AssetSymbolEnum.KRT,
  [AssetNativeDenomEnum.ubusd]: AssetSymbolEnum.BUSD,
  [AssetNativeDenomEnum.uluna]: AssetSymbolEnum.Luna,
  [AssetNativeDenomEnum.ubsdr]: AssetSymbolEnum.BSDT,
  [AssetNativeDenomEnum.ubmnt]: AssetSymbolEnum.BBMNT,
}

const terraDenoms = {
  [symbolOfDenom[AssetNativeDenomEnum.ubkrw]]: AssetNativeDenomEnum.ubkrw,
  [symbolOfDenom[AssetNativeDenomEnum.ubusd]]: AssetNativeDenomEnum.ubusd,
  [symbolOfDenom[AssetNativeDenomEnum.ubsdr]]: AssetNativeDenomEnum.ubsdr,
  [symbolOfDenom[AssetNativeDenomEnum.ubmnt]]: AssetNativeDenomEnum.ubmnt,
}

const nativeDenoms = {
  ...terraDenoms,
  [symbolOfDenom[AssetNativeDenomEnum.uluna]]: AssetNativeDenomEnum.uluna,
}

export default {
  nativeDenoms,
  symbolOfDenom,
  TERRA_DECIMAL,
  ETHER_BASE_DECIMAL,
}
