import _ from 'lodash'
import BigNumber from 'bignumber.js'
import { useRecoilValue } from 'recoil'

import { ASSET, UTIL } from 'consts'

import { AssetNativeDenomEnum } from 'types/asset'

import ContractStore, { ShuttleUbusdPairType } from 'store/ContractStore'

import useMantle from './useMantle'
import SendStore from 'store/SendStore'
import { BlockChainType } from 'types/network'

const OracleDenomsExchangeRates = `
query {
    OracleDenomsExchangeRates {
      Height
      Result {
        Amount
        Denom
      }
    }
  }
  `

const getTerraMAssetPairContract = (
  addressList: ShuttleUbusdPairType
): string => {
  const mapped = _.map(
    addressList,
    (pairContractAddress, tokenAddress) =>
      `${tokenAddress}: WasmContractsContractAddressStore(
            ContractAddress: "${pairContractAddress}"
            QueryMsg: "{\\"pool\\":{}}"
        ) {
            Height
            Result
        }`
  )

  return `
  query {
    ${mapped}
  }
`
}

interface AssetToken {
  amount: string
  info: {
    token: { contract_addr: string }
  }
}

interface NativeToken {
  amount: string
  info: {
    native_token: { denom: string }
  }
}

const useShuttle = (): {
  getTerraShuttleFee: ({
    denom,
    amount,
  }: {
    denom: string
    amount: BigNumber
  }) => Promise<BigNumber>
} => {
  const { fetchQuery } = useMantle()
  const shuttleUbusdPairs = useRecoilValue(ContractStore.shuttleUbusdPairs)
  const etherVaultTokenList = useRecoilValue(ContractStore.etherVaultTokenList)
  const toBlockChain = useRecoilValue(SendStore.toBlockChain)
  const asset = useRecoilValue(SendStore.asset)

  const getTerraDenomShuttleFee = async ({
    denom,
    amount,
  }: {
    denom: string
    amount: BigNumber
  }): Promise<BigNumber> => {
    const minBusd = new BigNumber(ASSET.TERRA_DECIMAL)
    const zeroDotOnePerAmount = amount.times(0.001).dp(0)

    if (denom === AssetNativeDenomEnum.ubusd) {
      return zeroDotOnePerAmount.isGreaterThan(minBusd)
        ? zeroDotOnePerAmount
        : minBusd
    }

    const fetchResult = await fetchQuery({
      query: OracleDenomsExchangeRates,
    })

    const denomLunaPriceList: {
      Amount: string
      Denom: string
    }[] = fetchResult?.OracleDenomsExchangeRates.Result || []

    if (_.some(denomLunaPriceList)) {
      const ubusdLunaPrice = new BigNumber(
        denomLunaPriceList.find((x) => x.Denom === AssetNativeDenomEnum.ubusd)
          ?.Amount || 1
      )
      const targetLunaPrice =
        denom === AssetNativeDenomEnum.uluna
          ? new BigNumber(1)
          : new BigNumber(
              denomLunaPriceList.find((x) => x.Denom === denom)?.Amount || 1
            )
      const oneBusdValueTargetPrice = targetLunaPrice
        .div(ubusdLunaPrice)
        .times(ASSET.TERRA_DECIMAL)
        .dp(0)

      return zeroDotOnePerAmount.isGreaterThan(oneBusdValueTargetPrice)
        ? zeroDotOnePerAmount
        : oneBusdValueTargetPrice
    }
    return new BigNumber(0)
  }

  const getTerraCW20TokenShuttleFee = async ({
    contractAddress,
    amount,
  }: {
    contractAddress: string
    amount: BigNumber
  }): Promise<BigNumber> => {
    const query = getTerraMAssetPairContract(shuttleUbusdPairs)
    const zeroDotOnePerAmount = amount.times(0.001)

    const etherVaultToken = etherVaultTokenList[asset?.terraToken || '']
    if (etherVaultToken && toBlockChain === BlockChainType.ethereum) {
      const tokenPrice = await etherVaultToken.getPricePerBusd()
      const minimumPrice = UTIL.toBignumber('1')
        .div(tokenPrice)
        .multipliedBy(ASSET.TERRA_DECIMAL)
        .dp(0)

      return tokenPrice.isEqualTo(0) ||
        zeroDotOnePerAmount.isGreaterThan(minimumPrice)
        ? zeroDotOnePerAmount
        : minimumPrice
    }

    const fetchResult: Record<
      string,
      {
        Result: string
      }
    > = await fetchQuery({
      query,
    })

    const assets =
      (fetchResult &&
        UTIL.jsonTryParse<{ assets: (NativeToken | AssetToken)[] }>(
          fetchResult[contractAddress]?.Result
        )?.assets) ||
      []

    if (_.some(assets)) {
      const ubusd = new BigNumber(
        assets.find(({ info }) => 'native_token' in info)?.amount ?? '1'
      )
      const token = new BigNumber(
        assets.find(({ info }) => 'token' in info)?.amount ?? '0'
      )
      const oneBusdValueTargetPrice = token
        .div(ubusd)
        .times(ASSET.TERRA_DECIMAL)
        .dp(0)

      return zeroDotOnePerAmount.isGreaterThan(oneBusdValueTargetPrice)
        ? zeroDotOnePerAmount
        : oneBusdValueTargetPrice
    }
    return new BigNumber(0)
  }

  // at least 1*
  const getTerraShuttleFee = async ({
    denom,
    amount,
  }: {
    denom: string
    amount: BigNumber
  }): Promise<BigNumber> => {
    return UTIL.isNativeDenom(denom)
      ? getTerraDenomShuttleFee({ denom, amount })
      : getTerraCW20TokenShuttleFee({ contractAddress: denom, amount })
  }

  return {
    getTerraShuttleFee,
  }
}

export default useShuttle
