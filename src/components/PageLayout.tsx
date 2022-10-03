import React, { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import useAppSettings from '@/application/appSettings/useAppSettings'
import { refreshWindow } from '@/application/appVersion/forceWindowRefresh'
import { useAppVersion } from '@/application/appVersion/useAppVersion'
import { setLocalItem } from '@/functions/dom/jStorage'
import { isString } from '@/functions/judgers/dateType'
import useDocumentMetaTitle from '@/hooks/useDocumentMetaTitle'
import { useUrlQuery } from '@/hooks/useUrlQuery'
import Button from './Button'
import Card from './Card'
import { Checkbox } from './Checkbox'
import Col from './Col'
import Dialog from './Dialog'
import Drawer from './Drawer'
import { FadeIn } from './FadeIn'
import Grid from './Grid'
import Icon from './Icon'
import Image from './Image'
import Link from './Link'
import MessageBoardWidget from './navWidgets/MessageBoardWidget'
import WalletWidget from './navWidgets/WalletWidget'
import ResponsiveDialogDrawer from './ResponsiveDialogDrawer'
import Row from './Row'

/**
 * for easier to code and read
 *
 * TEMP: add haveData to fix scrolling bug
 */
export default function PageLayout(props: {
  /** only mobile  */
  mobileBarTitle?:
    | string
    | {
        items: DropdownTitleInfoItem[]
        currentValue?: string
        onChange?: (value: string) => void
        urlSearchQueryKey?: string
        drawerTitle?: string
      }
  metaTitle?: string
  children?: ReactNode
  className?: string
  contentClassName?: string
  topbarClassName?: string
  sideMenuClassName?: string

  contentYPaddingShorter?: boolean // it will set both contentTopPaddingShorter and contentButtonPaddingShorter
  contentButtonPaddingShorter?: boolean // it will cause content bottom padding shorter than usual
  contentTopPaddingShorter?: boolean // it will cause content top padding shorter than usual

  // showWalletWidget?: boolean
  // showRpcWidget?: boolean
  // showLanguageWidget?: boolean
}) {
  useDocumentMetaTitle(props.metaTitle)
  const isMobile = useAppSettings((s) => s.isMobile)
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  return (
    <div
      style={{
        padding:
          'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)',
        position: 'relative',
        display: 'grid',
        gridTemplate: isMobile
          ? `
          "d" auto
          "a" auto
          "c" 1fr / 1fr`
          : `
          "d d d" auto
          "a a a" auto
          "b c c" 1fr
          "b c c" 1fr / auto 1fr 1fr`,
        overflow: 'hidden', // establish a BFC
        willChange: 'opacity'
      }}
      className={`w-full mobile:w-full h-full mobile:h-full`}
    >
      <RPCPerformanceBanner className="grid-area-d" />
      {isMobile ? (
        <>
          <Navbar className="grid-area-a" barTitle={props.mobileBarTitle} onOpenMenu={() => setIsSideMenuOpen(true)} />
        </>
      ) : (
        <>
          <Navbar className="grid-area-a" />
        </>
      )}
      <main
        // always occupy scrollbar space
        className={twMerge(
          `PageLayoutContent relative isolate flex-container grid-area-c bg-gradient-to-b from-[#0c0927] to-[#110d36] rounded-tl-3xl mobile:rounded-none p-12 ${
            props.contentButtonPaddingShorter ?? props.contentYPaddingShorter ? 'pb-4' : ''
          } ${props.contentTopPaddingShorter ?? props.contentYPaddingShorter ? 'pt-5' : ''} mobile:py-2 mobile:px-3`,
          props.contentClassName
        )}
        style={{
          overflowX: 'hidden',
          overflowY: 'scroll'
        }}
      >
        {/* do not check ata currently
        <MigrateBubble /> */}
        <VersionTooOldDialog />
        <DisclaimerDialog />
        {props.children}
      </main>
    </div>
  )
}
function RPCPerformanceBanner({ className }: { className?: string }) {
  const isLowRpcPerformance = useAppSettings((s) => s.isLowRpcPerformance)

  return (
    <div className={className}>
      <FadeIn>
        {isLowRpcPerformance && (
          <div className="bg-[#dacc363f] text-center text-[#D8CB39] text-sm mobile:text-xs px-4 py-1">
            The Solana network is experiencing congestion or reduced performance. Transactions may fail to send or
            confirm.
          </div>
        )}
      </FadeIn>
    </div>
  )
}

function VersionTooOldDialog() {
  const versionRefreshData = useAppVersion((s) => s.versionFresh)
  const isInBonsaiTest = useAppSettings((s) => s.isInBonsaiTest)
  const isInLocalhost = useAppSettings((s) => s.isInLocalhost)
  return (
    <Dialog open={versionRefreshData === 'too-old' && !isInLocalhost && !isInBonsaiTest} canClosedByMask={false}>
      {({ close }) => (
        <Card
          className={twMerge(`p-8 rounded-3xl w-[min(480px,95vw)] mx-8 border-1.5 border-[rgba(171,196,255,0.2)]`)}
          size="lg"
          style={{
            background:
              'linear-gradient(140.14deg, rgba(0, 182, 191, 0.15) 0%, rgba(27, 22, 89, 0.1) 86.61%), linear-gradient(321.82deg, #18134D 0%, #1B1659 100%)',
            boxShadow: '0px 8px 48px rgba(171, 196, 255, 0.12)'
          }}
        >
          <Col className="items-center">
            <div className="font-semibold text-xl text-[#D8CB39] mb-3 text-center">New version available</div>
            <div className="text-center mt-2  mb-6 text-[#ABC4FF]">Refresh the page to update and use the app.</div>

            <div className="self-stretch">
              <Col>
                <Button
                  className={`text-[#ABC4FF]  frosted-glass-teal`}
                  onClick={() => refreshWindow({ noCache: true })}
                >
                  Refresh
                </Button>
                <Button className="text-[#ABC4FF]" type="text" onClick={close}>
                  Update later
                </Button>
              </Col>
            </div>
          </Col>
        </Card>
      )}
    </Dialog>
  )
}
function DisclaimerDialog() {
  const needPopDisclaimer = useAppSettings((s) => s.needPopDisclaimer)
  const [userHaveClickedAgree, setUserHaveClickedAgree] = useState(false)
  const confirmDisclaimer = () => {
    useAppSettings.setState({ needPopDisclaimer: false })
    setLocalItem<boolean>('USER_AGREE_DISCLAIMER', true)
  }
  return (
    <ResponsiveDialogDrawer
      maskNoBlur
      placement="from-bottom"
      open={Boolean(needPopDisclaimer)}
      canClosedByMask={false}
    >
      <Card
        className={twMerge(
          `flex flex-col p-8 mobile:p-5 rounded-3xl mobile:rounded-b-none mobile:h-[80vh] w-[min(552px,100vw)] mobile:w-full border-1.5 border-[rgba(171,196,255,0.2)]`
        )}
        size="lg"
        style={{
          background:
            'linear-gradient(140.14deg, rgba(0, 182, 191, 0.15) 0%, rgba(27, 22, 89, 0.1) 86.61%), linear-gradient(321.82deg, #18134D 0%, #1B1659 100%)',
          boxShadow: '0px 8px 48px rgba(171, 196, 255, 0.12)'
        }}
      >
        {/* title */}
        <div className="text-xl font-semibold text-white">Disclaimer</div>

        {/* content */}
        <div className="grow text-sm leading-normal text-[#abc4ffb3] scrollbar-width-thin overflow-auto h-96 mobile:h-12 rounded p-4 my-6 mobile:my-4 bg-[#141041]">
          <p className="mb-3">
            This website-hosted user interface (this "Interface") is an open source frontend software portal to the
            Raydium protocol, a decentralized and community-driven collection of blockchain-enabled smart contracts and
            tools (the "Raydium Protocol"). This Interface and the Raydium Protocol are made available by the Raydium
            Holding Foundation, however all transactions conducted on the protocol are run by related permissionless
            smart contracts. As the Interface is open-sourced and the Raydium Protocol and its related smart contracts
            are accessible by any user, entity or third party, there are a number of third party web and mobile
            user-interfaces that allow for interaction with the Raydium Protocol.
          </p>
          <p className="mb-3">
            THIS INTERFACE AND THE RAYDIUM PROTOCOL ARE PROVIDED "AS IS", AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF
            ANY KIND. The Raydium Holding Foundation does not provide, own, or control the Raydium Protocol or any
            transactions conducted on the protocol or via related smart contracts. By using or accessing this Interface
            or the Raydium Protocol and related smart contracts, you agree that no developer or entity involved in
            creating, deploying or maintaining this Interface or the Raydium Protocol will be liable for any claims or
            damages whatsoever associated with your use, inability to use, or your interaction with other users of, this
            Interface or the Raydium Protocol, including any direct, indirect, incidental, special, exemplary, punitive
            or consequential damages, or loss of profits, digital assets, tokens, or anything else of value.
          </p>
          <p className="mb-3">
            The Raydium Protocol is not available to residents of Belarus, the Central African Republic, The Democratic
            Republic of Congo, the Democratic People's Republic of Korea, the Crimea, Donetsk People's Republic, and
            Luhansk People's Republic regions of Ukraine, Cuba, Iran, Libya, Somalia, Sudan, South Sudan, Syria, the
            USA, Yemen, Zimbabwe and any other jurisdiction in which accessing or using the Raydium Protocol is
            prohibited (the "Prohibited Jurisdictions").
          </p>
          <p className="mb-3">
            By using or accessing this Interface, the Raydium Protocol, or related smart contracts, you represent that
            you are not located in, incorporated or established in, or a citizen or resident of the Prohibited
            Jurisdictions. You also represent that you are not subject to sanctions or otherwise designated on any list
            of prohibited or restricted parties or excluded or denied persons, including but not limited to the lists
            maintained by the United States' Department of Treasury's Office of Foreign Assets Control, the United
            Nations Security Council, the European Union or its Member States, or any other government authority.
          </p>
        </div>

        <Col className="">
          <Checkbox
            checkBoxSize="sm"
            className="mt-2 mb-6"
            checked={userHaveClickedAgree}
            onChange={setUserHaveClickedAgree}
            label={<div className="text-sm  text-white">I have read, understand and accept these terms.</div>}
          />

          <Button
            disabled={!userHaveClickedAgree}
            className={`text-[#ABC4FF]  frosted-glass-teal`}
            onClick={confirmDisclaimer}
          >
            Agree and Continue
          </Button>
        </Col>
      </Card>
    </ResponsiveDialogDrawer>
  )
}


function Navbar({
  barTitle,
  className,
  style,
  onOpenMenu
}: {
  className?: string
  barTitle?:
    | string
    | {
        items: DropdownTitleInfoItem[]
        currentValue?: string
        onChange?: (value: string) => void
        urlSearchQueryKey?: string
        drawerTitle?: string
      }
  style?: CSSProperties
  // TODO: move it into useAppSetting()
  onOpenMenu?: () => void
}) {
  const isMobile = useAppSettings((s) => s.isMobile)
  const pcNavContent = (
    <Row className="justify-between items-center">
      <h5 className='logoh'>SOLLINX SWAP</h5>

      <Row className="gap-8 items-center">
        <WalletWidget />
      </Row>
    </Row>
  )
  const mobileNavContent = (
    <Grid className="grid-cols-[1fr,2fr,1fr] mobile:px-5 mobile:py-3  items-center bg-cyberpunk-card-bg cyberpunk-bg-light">

      {barTitle ? (
        isString(barTitle) ? (
          <div onClick={onOpenMenu} className="text-lg font-semibold place-self-center text-white -mb-1">
            {barTitle}
          </div>
        ) : (
          <MobileDropdownTitle
            titles={barTitle.items}
            currentValue={barTitle.currentValue}
            onChange={(value) => {
              barTitle.onChange?.(value)
            }}
            urlSearchQueryKey={barTitle.urlSearchQueryKey}
            drawerTitle={barTitle.drawerTitle}
          />
        )
      ) : (
        <Link className="place-self-center" href="/">
          <Image className="cursor-pointer" src="/logo/logo-only-icon.svg" />
        </Link>
      )}

      <Row className="gap-4 items-center justify-self-end">
        <WalletWidget />
      </Row>
    </Grid>
  )
  return (
    <nav className={twMerge('select-none text-white px-12 py-4 mobile:p-0 transition-all', className)} style={style}>
      {isMobile ? mobileNavContent : pcNavContent}
    </nav>
  )
}

type DropdownTitleInfoItem = {
  value: string
  barLabel?: string
  itemLabel?: string
}

function MobileDropdownTitle({
  titles,
  currentValue: defaultCurrentValue = titles[0].value,
  urlSearchQueryKey,
  onChange,
  drawerTitle
}: {
  titles: DropdownTitleInfoItem[]
  currentValue?: string
  urlSearchQueryKey?: string
  onChange?: (titleValue: string) => void
  drawerTitle?: string
}) {
  const [currentValue, setCurrentValue] = useState(defaultCurrentValue)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const currentTitleInfoItem = titles.find(({ value }) => value === currentValue)!
  useUrlQuery({
    currentValue: currentValue,
    values: titles.map((i) => i.value),
    onChange: onChange,
    queryKey: urlSearchQueryKey
  })

  return (
    <>
      <Row
        onClick={() => setIsDropdownOpen(true)}
        className="self-stretch gap-4 items-center justify-between font-medium px-3 bg-[#141041] rounded-lg"
      >
        {/* title */}
        <div className="text-white whitespace-nowrap">{currentTitleInfoItem.barLabel}</div>

        {/* icon */}
        <Icon heroIconName="chevron-down" size="xs" className="text-[#abc4ff80]" />
      </Row>

      <Drawer placement="from-bottom" open={isDropdownOpen} onClose={() => setIsDropdownOpen(false)}>
        {({ close }) => (
          <Card
            className="flex flex-col max-h-[60vh] mobile:max-h-full mobile:rounded-tl-3xl mobile:rounded-tr-3xl  mobile:w-full border-1.5 border-[rgba(171,196,255,0.2)] overflow-hidden bg-cyberpunk-card-bg "
            size="lg"
          >
            <Row className="justify-between items-center  py-2 pt-6 px-8">
              <div className="text-xs text-[#abc4ff] pl-2">{drawerTitle}</div>
              <Icon className="text-[#ABC4FF] cursor-pointer" size="smi" heroIconName="x" onClick={close} />
            </Row>

            <Col className="pb-2 px-4 divide-y divide-[rgba(171,196,255,0.2)]">
              {titles.map(({ value, itemLabel = value }) => {
                return (
                  <div
                    key={value}
                    className={`py-4 px-6 font-normal ${
                      value === currentValue ? 'text-white' : 'text-[rgba(171,196,255,0.5)] '
                    }`}
                    onClick={() => {
                      onChange?.(value)
                      setCurrentValue(value)
                      close()
                    }}
                  >
                    {itemLabel}
                  </div>
                )
              })}
            </Col>
          </Card>
        )}
      </Drawer>
    </>
  )
}

