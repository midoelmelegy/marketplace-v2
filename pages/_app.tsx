import AnalyticsProvider, {
  initializeAnalytics,
} from 'components/AnalyticsProvider'
initializeAnalytics()
import ErrorTrackingProvider from 'components/ErrorTrackingProvider'

import { Inter } from "next/font/google"
import type { AppContext, AppProps } from 'next/app'
import { default as NextApp } from 'next/app'
import { ThemeProvider, useTheme } from 'next-themes'
import { darkTheme, globalReset } from 'stitches.config'
import '@rainbow-me/rainbowkit/styles.css'
import {
  RainbowKitProvider,
  getDefaultWallets,
  darkTheme as rainbowDarkTheme,
  lightTheme as rainbowLightTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import * as Tooltip from '@radix-ui/react-tooltip'
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'

import {
  ReservoirKitProvider,
  darkTheme as reservoirDarkTheme,
  lightTheme as reservoirLightTheme,
  ReservoirKitTheme,
  CartProvider,
} from '@reservoir0x/reservoir-kit-ui'
import { FC, useContext, useEffect, useState } from 'react'
import { HotkeysProvider } from 'react-hotkeys-hook'
import ToastContextProvider from 'context/ToastContextProvider'
import supportedChains from 'utils/chains'
import { useMarketplaceChain } from 'hooks'
import ChainContextProvider from 'context/ChainContextProvider'
import { WebsocketContextProvider } from 'context/WebsocketContextProvider'
import ReferralContextProvider, {
  ReferralContext,
} from 'context/ReferralContextProvider'
import { chainPaymentTokensMap } from 'utils/paymentTokens'

//CONFIGURABLE: Use nextjs to load your own custom font: https://nextjs.org/docs/basic-features/font-optimization
const inter = Inter({
  subsets: ['latin'],
})

const MARKETPLACE_FEES = process.env.NEXT_PUBLIC_MARKETPLACE_FEES
  ? (JSON.parse(process.env.NEXT_PUBLIC_MARKETPLACE_FEES) as string[])
  : undefined
export const NORMALIZE_ROYALTIES = process.env.NEXT_PUBLIC_NORMALIZE_ROYALTIES
  ? process.env.NEXT_PUBLIC_NORMALIZE_ROYALTIES === 'true'
  : false

const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''

const DISABLE_PROXY =
  process.env.NEXT_PUBLIC_DISABLE_PROXY === 'true' ? true : false

const { chains, publicClient } = configureChains(supportedChains, [
  alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID || '' }),
  publicProvider(),
])

const { connectors } = getDefaultWallets({
  appName: 'SeaPort Market',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains,
})

const wagmiClient = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

//CONFIGURABLE: Here you can override any of the theme tokens provided by RK: https://docs.reservoir.tools/docs/reservoir-kit-theming-and-customization
const reservoirKitThemeOverrides = {
  headlineFont: inter.style.fontFamily,
  font: inter.style.fontFamily,
  primaryColor: '#1d4ed8',
  primaryHoverColor: '#1e3a8a',
}

function AppWrapper(props: AppProps & { baseUrl: string }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      value={{
        dark: darkTheme.className,
        light: 'light',
      }}
    >
      <WagmiConfig config={wagmiClient}>
        <ChainContextProvider>
          <AnalyticsProvider>
            <ErrorTrackingProvider>
              <ReferralContextProvider>
                <MyApp {...props} />
              </ReferralContextProvider>
            </ErrorTrackingProvider>
          </AnalyticsProvider>
        </ChainContextProvider>
      </WagmiConfig>
    </ThemeProvider>
  )
}

function MyApp({
  Component,
  pageProps,
  baseUrl,
}: AppProps & { baseUrl: string }) {
  globalReset()

  const { theme } = useTheme()
  const marketplaceChain = useMarketplaceChain()
  const [reservoirKitTheme, setReservoirKitTheme] = useState<
    ReservoirKitTheme | undefined
  >()

  const [rainbowKitTheme, setRainbowKitTheme] = useState<
    | ReturnType<typeof rainbowDarkTheme>
    | ReturnType<typeof rainbowLightTheme>
    | undefined
  >()

  useEffect(() => {
    if (theme == 'dark') {
      setReservoirKitTheme(reservoirDarkTheme(reservoirKitThemeOverrides))
      setRainbowKitTheme(
        rainbowDarkTheme({
          borderRadius: 'small',
        })
      )
    } else {
      setReservoirKitTheme(reservoirLightTheme(reservoirKitThemeOverrides))
      setRainbowKitTheme(
        rainbowLightTheme({
          borderRadius: 'small',
        })
      )
    }
  }, [theme])
  const { feesOnTop } = useContext(ReferralContext)

  const FunctionalComponent = Component as FC

  let source = process.env.NEXT_PUBLIC_MARKETPLACE_SOURCE

  if (!source && process.env.NEXT_PUBLIC_HOST_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_HOST_URL)
      source = url.host
    } catch (e) {}
  }

  return (
    <HotkeysProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        value={{
          dark: darkTheme.className,
          light: 'light',
        }}
      >
        <ReservoirKitProvider
          options={{
            // Reservoir API key which you can generate at https://reservoir.tools/
            // This is a protected key and displays as 'undefined' on the browser
            // DO NOT add NEXT_PUBLIC to the key or you'll risk leaking it on the browser
            apiKey: process.env.RESERVOIR_API_KEY,
            //CONFIGURABLE: Override any configuration available in RK: https://docs.reservoir.tools/docs/reservoirkit-ui#configuring-reservoirkit-ui
            // Note that you should at the very least configure the source with your own domain
            chains: supportedChains.map(
              ({
                reservoirBaseUrl,
                proxyApi,
                id,
                name,
                checkPollingInterval,
              }) => {
                let proxy = !DISABLE_PROXY && proxyApi ? proxyApi : null
                return {
                  id,
                  name,
                  baseApiUrl: proxy
                    ? `${baseUrl}${proxyApi}`
                    : reservoirBaseUrl,
                  proxyApi: proxy,
                  active: marketplaceChain.id === id,
                  checkPollingInterval: checkPollingInterval,
                  paymentTokens: chainPaymentTokensMap[id],
                }
              }
            ),
            logLevel: 4,
            source: source,
            normalizeRoyalties: NORMALIZE_ROYALTIES,
            disablePoweredByReservoir: true,
            //marketplaceFees: MARKETPLACE_FEES,
            //CONFIGURABLE: Set your marketplace fee and recipient, (fee is in BPS)
            // Note that this impacts orders created on your marketplace (offers/listings)
            // feesOnTopBps={["0xabc:50", "0xdef:50"]}
            // feesOnTopFixed={["0xabc:50", "0xdef:10000000000000000"]}
            marketplaceFees: ['0x4c31e558393312a1d3bE14C45A3656A2e915F53D:250'],
          }}
          theme={reservoirKitTheme}
        >
          <CartProvider feesOnTopBps={["0x4c31e558393312a1d3bE14C45A3656A2e915F53D:250"]}>
            <WebsocketContextProvider>
              <Tooltip.Provider>
                <RainbowKitProvider
                  chains={chains}
                  theme={rainbowKitTheme}
                  modalSize="compact"
                >
                  <ToastContextProvider>
                    <FunctionalComponent {...pageProps} />
                  </ToastContextProvider>
                </RainbowKitProvider>
              </Tooltip.Provider>
            </WebsocketContextProvider>
          </CartProvider>
        </ReservoirKitProvider>
      </ThemeProvider>
    </HotkeysProvider>
  )
}

AppWrapper.getInitialProps = async (appContext: AppContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await NextApp.getInitialProps(appContext)
  let baseUrl = ''

  if (appContext.ctx.req?.headers.host) {
    const host = appContext.ctx.req?.headers.host
    baseUrl = `${host.includes('localhost') ? 'http' : 'https'}://${host}`
  } else if (process.env.NEXT_PUBLIC_HOST_URL) {
    baseUrl = process.env.NEXT_PUBLIC_HOST_URL || ''
  }
  baseUrl = baseUrl.replace(/\/$/, '')

  return { ...appProps, baseUrl }
}

export default AppWrapper
