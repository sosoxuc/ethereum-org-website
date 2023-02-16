// Libraries
import React, { HTMLAttributes, ReactNode, useEffect, useState } from "react"
import { graphql, PageProps } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"
import { useIntl } from "react-intl"
import {
  Badge,
  Box,
  Center,
  Divider,
  DividerProps,
  Flex,
  GridItem,
  Icon,
  ListItem,
  SimpleGrid,
  Text,
  UnorderedList,
  useBreakpointValue,
} from "@chakra-ui/react"

// Data
import layer2Data from "../data/layer-2/layer-2.json"

// Components
import ButtonLink from "../components/ButtonLink"
import Card from "../components/Card"
import ExpandableCard from "../components/ExpandableCard"
import FeedbackCard from "../components/FeedbackCard"
import InfoBanner from "../components/InfoBanner"
import Layer2Onboard from "../components/Layer2/Layer2Onboard"
import Layer2ProductCard from "../components/Layer2ProductCard"
import Link from "../components/Link"
import OrderedList from "../components/OrderedList"
import PageHero from "../components/PageHero"
import PageMetadata from "../components/PageMetadata"
import ProductList from "../components/ProductList"
import QuizWidget from "../components/Quiz/QuizWidget"
import Tooltip from "../components/Tooltip"
import Translation from "../components/Translation"

// Utils
import { getData } from "../utils/cache"
import {
  translateMessageId,
  getLocaleForNumberFormat,
  TranslationKey,
} from "../utils/translations"
import { Lang } from "../utils/languages"
import { getImage } from "../utils/image"

// Constants
import { GATSBY_FUNCTIONS_PATH } from "../constants"
import { MdInfoOutline } from "react-icons/md"

type ChildOnlyType = {
  children: ReactNode
}

const ContentBox = (
  props: HTMLAttributes<"div"> & {
    children: ReactNode
    isLightGrayBg?: boolean
  }
) => (
  <Box
    px={8}
    py={12}
    width="full"
    {...(props.isLightGrayBg && { background: "layer2ContentSecondary" })}
  >
    {props.children}
  </Box>
)

const StyledInfoIcon = () => (
  <Icon
    as={MdInfoOutline}
    color="text"
    mr={2}
    opacity={0.8}
    _hover={{ color: "primary" }}
    _active={{ color: "primary" }}
    _focus={{ color: "primary" }}
  />
)

const TwoColumnContent = (props: ChildOnlyType) => (
  <Flex
    justifyContent="space-between"
    gap={16}
    flexDirection={{ base: "column", lg: "row" }}
    alignItems={{ base: "flex-start", lg: "normal" }}
    {...props}
  />
)

const StatDivider = () => {
  const responsiveOrientation = useBreakpointValue<DividerProps["orientation"]>(
    { base: "horizontal", md: "vertical" }
  )
  return (
    <Divider
      orientation={responsiveOrientation}
      borderColor="homeDivider"
      my={{ base: 8, md: 0 }}
    />
  )
}

const StatBox = (props: ChildOnlyType) => (
  <Center
    flexDirection="column"
    flex={{ base: "100%", md: "33%" }}
    textAlign="center"
    px={5}
    {...props}
  />
)

const StatPrimary = (props: { content: string }) => (
  <Text
    color="primary"
    fontFamily="monospace"
    fontWeight="bold"
    fontSize="2rem"
  >
    {props.content}
  </Text>
)

const StatSpan = (props: ChildOnlyType) => (
  <Flex justifyContent="center" gap={2} {...props} />
)

const StatDescription = (props: ChildOnlyType) => (
  <Text opacity={0.8} m={0} {...props} />
)

interface L2DataResponseItem {
  daily: {
    data: Array<[string, number, number]>
  }
}
interface L2DataResponse {
  layers2s: L2DataResponseItem
  combined: L2DataResponseItem
  bridges: L2DataResponseItem
}

interface FeeDataResponse {
  data: Array<{ id: string; results: { feeTransferEth: number } }>
}

const Layer2Page = ({ data }: PageProps<Queries.Layer2PageQuery>) => {
  const intl = useIntl()
  const [tvl, setTVL] = useState("loading...")
  const [percentChangeL2, setL2PercentChange] = useState("loading...")
  const [averageFee, setAverageFee] = useState("loading...")

  useEffect(() => {
    const localeForStatsBoxNumbers = getLocaleForNumberFormat(
      intl.locale as Lang
    )

    const fetchL2Beat = async (): Promise<void> => {
      try {
        const l2BeatData = await getData<L2DataResponse>(
          `${GATSBY_FUNCTIONS_PATH}/l2beat`
        )

        const dailyData = l2BeatData.layers2s.daily.data

        // formatted TVL from L2beat API formatted
        const TVL = new Intl.NumberFormat(localeForStatsBoxNumbers, {
          style: "currency",
          currency: "USD",
          notation: "compact",
          minimumSignificantDigits: 2,
          maximumSignificantDigits: 3,
        }).format(dailyData[dailyData.length - 1][1])

        setTVL(`${TVL}`)
        // Calculate percent change ((new value - old value) / old value) *100)
        const percentage =
          ((dailyData[dailyData.length - 1][1] -
            dailyData[dailyData.length - 31][1]) /
            dailyData[dailyData.length - 31][1]) *
          100
        setL2PercentChange(
          percentage > 0
            ? `+${percentage.toFixed(2)}%`
            : `${percentage.toFixed(2)}%`
        )
      } catch (error) {
        console.error(error)
        setTVL("Error, please refresh.")
        setL2PercentChange("Error, please refresh.")
      }
    }
    fetchL2Beat()

    const fetchCryptoStats = async (): Promise<void> => {
      try {
        // Average eth transfer fee from L2's supported by cryptostats API
        const feeDataResponse = await getData<FeeDataResponse>(
          "https://api.cryptostats.community/api/v1/l2-fees/feeTransferEth?metadata=false"
        )

        // filtering out L2's we arent listing
        const feeData = feeDataResponse.data.filter((l2) => l2.id !== "hermez")

        const feeAverage =
          feeData.reduce(
            (acc, curr) => (acc += curr.results.feeTransferEth),
            0
          ) / feeData.length

        const intlFeeAverage = new Intl.NumberFormat(localeForStatsBoxNumbers, {
          style: "currency",
          currency: "USD",
          notation: "compact",
          minimumSignificantDigits: 2,
          maximumSignificantDigits: 3,
        }).format(feeAverage)
        setAverageFee(`${intlFeeAverage}`)
      } catch (error) {
        setAverageFee("Error, please refresh.")
        console.error(error)
      }
    }
    fetchCryptoStats()
  }, [intl.locale])

  const heroContent = {
    title: translateMessageId("layer-2-hero-title", intl),
    header: translateMessageId("layer-2-hero-header", intl),
    subtitle: translateMessageId("layer-2-hero-subtitle", intl),
    image: getImage(data.heroImage)!,
    alt: translateMessageId("layer-2-hero-alt-text", intl),
    buttons: [
      {
        content: translateMessageId("layer-2-hero-button-1", intl),
        toId: "what-is-layer-2",
      },
      {
        content: translateMessageId("layer-2-hero-button-2", intl),
        toId: "use-layer-2",
        variant: "outline",
      },
      {
        content: translateMessageId("layer-2-hero-button-3", intl),
        toId: "how-to-get-onto-layer-2",
        variant: "outline",
      },
    ],
  }

  const layer2Cards = [
    {
      emoji: ":money_with_wings:",
      title: translateMessageId("layer-2-lower-fees-title", intl),
      description: translateMessageId("layer-2-lower-fees-description", intl),
    },
    {
      emoji: ":closed_lock_with_key:",
      title: translateMessageId("layer-2-maintain-security-title", intl),
      description: translateMessageId(
        "layer-2-maintain-security-description",
        intl
      ),
    },
    {
      emoji: ":hammer_and_wrench:",
      title: translateMessageId("layer-2-expand-use-cases-title", intl),
      description: translateMessageId(
        "layer-2-expand-use-cases-description",
        intl
      ),
    },
  ]

  const rollupCards = [
    {
      image: getImage(data.optimisticRollup),
      title: translateMessageId("layer-2-optimistic-rollups-title", intl),
      description: translateMessageId(
        "layer-2-optimistic-rollups-description",
        intl
      ),
      childSentence: translateMessageId(
        "layer-2-optimistic-rollups-childSentance",
        intl
      ),
      childLink: "/developers/docs/scaling/optimistic-rollups/",
    },
    {
      image: getImage(data.zkRollup),
      title: translateMessageId("layer-2-zk-rollups-title", intl),
      description: translateMessageId("layer-2-zk-rollups-description", intl),
      childSentence: translateMessageId(
        "layer-2-zk-rollups-childSentance",
        intl
      ),
      childLink: "/developers/docs/scaling/zk-rollups/",
    },
  ]

  const toolsData = {
    information: [
      {
        title: "L2BEAT",
        description: translateMessageId(
          "layer-2-tools-l2beat-description",
          intl
        ),
        link: "https://l2beat.com",
        image: getImage(data.l2beat),
        alt: "L2BEAT",
      },
      {
        title: "L2 Fees",
        description: translateMessageId(
          "layer-2-tools-l2fees-description",
          intl
        ),
        link: "https://l2fees.info",
        image: getImage(data.doge),
        alt: "L2 Fees",
      },
      {
        title: "Chainlist",
        description: translateMessageId(
          "layer-2-tools-chainlist-description",
          intl
        ),
        link: "https://chainlist.org",
        image: getImage(data.doge),
        alt: "Chainlist",
      },
    ],
    walletManagers: [
      {
        title: "Zapper",
        description: translateMessageId(
          "layer-2-tools-zapper-description",
          intl
        ),
        link: "https://zapper.fi/",
        image: getImage(data.zapper),
        alt: "Zapper",
      },
      {
        title: "Zerion",
        description: translateMessageId(
          "layer-2-tools-zerion-description",
          intl
        ),
        link: "https://zerion.io",
        image: getImage(data.zerion),
        alt: "Zerion",
      },
      {
        title: "DeBank",
        description: translateMessageId(
          "layer-2-tools-debank-description",
          intl
        ),
        link: "https://debank.com",
        image: getImage(data.debank),
        alt: "DeBank",
      },
    ],
  }

  const layer2DataCombined = [...layer2Data.optimistic, ...layer2Data.zk]

  const tooltipContent = (metric: {
    apiUrl: string
    apiProvider: string
  }): JSX.Element => (
    <div>
      <Translation id="data-provided-by" />{" "}
      <Link to={metric.apiUrl}>{metric.apiProvider}</Link>
    </div>
  )

  return (
    <Flex flexDirection="column" alignItems="center">
      <PageMetadata
        title={"Layer 2"}
        description={"Introduction page to layer 2"}
      />

      {/* Hero Section */}
      <Box background="layer2Gradient" width="full">
        <Box pb={8}>
          <PageHero content={heroContent} isReverse />
        </Box>

        <ContentBox>
          <Center flexDirection={{ base: "column", md: "row" }} mb={16}>
            <StatBox>
              <StatPrimary content={tvl} />
              <StatSpan>
                <StatDescription>
                  <Translation id="layer-2-statsbox-1" />
                </StatDescription>
                <Tooltip
                  content={tooltipContent({
                    apiUrl: "https://l2beat.com/",
                    apiProvider: "L2BEAT",
                  })}
                >
                  <StyledInfoIcon />
                </Tooltip>
              </StatSpan>
            </StatBox>
            <StatDivider />
            <StatBox>
              <StatPrimary content={averageFee} />
              <StatSpan>
                <StatDescription>
                  <Translation id="layer-2-statsbox-2" />
                </StatDescription>
                <Tooltip
                  content={tooltipContent({
                    apiUrl: "https://cryptostats.community/",
                    apiProvider: "CryptoStats",
                  })}
                >
                  <StyledInfoIcon />
                </Tooltip>
              </StatSpan>
            </StatBox>
            <StatDivider />
            <StatBox>
              <StatPrimary content={percentChangeL2} />
              <StatSpan>
                <StatDescription>
                  <Translation id="layer-2-statsbox-3" />
                </StatDescription>
                <Tooltip
                  content={tooltipContent({
                    apiUrl: "https://l2beat.com/",
                    apiProvider: "L2BEAT",
                  })}
                >
                  <StyledInfoIcon />
                </Tooltip>
              </StatSpan>
            </StatBox>
          </Center>
        </ContentBox>
      </Box>
      {/* What is Layer 2 Section */}
      <ContentBox id="what-is-layer-2">
        <TwoColumnContent>
          <Box flex="50%">
            <h2>
              <Translation id="layer-2-what-is-layer-2-title" />
            </h2>
            <p>
              <Translation id="layer-2-what-is-layer-2-1" />
            </p>
            <p>
              <Translation id="layer-2-what-is-layer-2-2" />
            </p>
          </Box>
          <Box flex="50%">
            <GatsbyImage
              image={getImage(data.whatIsEthereum)!}
              alt=""
              style={{ maxHeight: "400px" }}
              objectFit="contain"
            />
          </Box>
        </TwoColumnContent>
      </ContentBox>
      {/* What is Layer 1 Section */}
      <ContentBox isLightGrayBg>
        <h2>
          <Translation id="layer-2-what-is-layer-1-title" />
        </h2>
        <TwoColumnContent>
          <Box flex="50%">
            <p>
              <Translation id="layer-2-what-is-layer-1-1" />
            </p>
            <p>
              <Translation id="layer-2-what-is-layer-1-2" />
            </p>
          </Box>
          <Box flex="50%">
            <p>
              <Translation id="layer-2-what-is-layer-1-list-title" />
            </p>
            <OrderedList
              listData={[
                <p>
                  <Translation id="layer-2-what-is-layer-1-list-1" />
                </p>,
                <p>
                  <Translation id="layer-2-what-is-layer-1-list-2" />
                </p>,
                <p>
                  <Translation id="layer-2-what-is-layer-1-list-3" />
                </p>,
                <p>
                  <Translation id="layer-2-what-is-layer-1-list-4" />
                </p>,
              ]}
            />
            <p>
              <Translation id="layer-2-what-is-layer-1-list-link-1" />{" "}
              <Link to="/what-is-ethereum/">
                <Translation id="layer-2-what-is-layer-1-list-link-2" />
              </Link>
            </p>
          </Box>
        </TwoColumnContent>
      </ContentBox>
      {/* Why Layer 2 Section */}
      <ContentBox>
        <TwoColumnContent>
          <Center flex="50%">
            <GatsbyImage
              image={getImage(data.dao)!}
              alt=""
              style={{ width: "100%" }}
              objectFit="contain"
            />
          </Center>
          <Box flex="50%">
            <h2>
              <Translation id="layer-2-why-do-we-need-layer-2-title" />
            </h2>
            <p>
              <Translation id="layer-2-why-do-we-need-layer-2-1" />
            </p>
            <p>
              <Translation id="layer-2-why-do-we-need-layer-2-2" />
            </p>

            <h3>
              <Translation id="layer-2-why-do-we-need-layer-2-scalability" />
            </h3>
            <p>
              <Translation id="layer-2-why-do-we-need-layer-2-scalability-1" />
            </p>
            <p>
              <Translation id="layer-2-why-do-we-need-layer-2-scalability-2" />
            </p>
            <Link to="/upgrades/vision/">
              <Translation id="layer-2-why-do-we-need-layer-2-scalability-3" />
            </Link>
          </Box>
        </TwoColumnContent>
        <h3>
          <Translation id="layer-2-benefits-of-layer-2-title" />
        </h3>
        <SimpleGrid
          columnGap={8}
          rowGap={4}
          templateColumns="repeat(auto-fill, minmax(340px, 1fr))"
        >
          {layer2Cards.map(({ emoji, title, description }, idx) => (
            <GridItem
              as={Card}
              description={description}
              title={title}
              emoji={emoji}
              key={idx}
              _hover={{
                transition: "0.1s",
                transform: "scale(1.01)",
                img: {
                  transition: "0.1s",
                  transform: "scale(1.1)",
                },
              }}
            />
          ))}
        </SimpleGrid>
      </ContentBox>
      {/* How does Layer 2 Work Section */}
      <ContentBox>
        <TwoColumnContent>
          <Box flex="50%">
            <h2>
              <Translation id="layer-2-how-does-layer-2-work-title" />
            </h2>
            <p>
              <Translation id="layer-2-how-does-layer-2-work-1" />
            </p>
            <p>
              <Translation id="layer-2-how-does-layer-2-work-2" />
            </p>
            <h3>
              <Translation id="layer-2-rollups-title" />
            </h3>
            <p>
              <Translation id="layer-2-rollups-1" />
            </p>
            <p>
              <Translation id="layer-2-rollups-2" />
            </p>
          </Box>
          <Center flex="50%">
            <GatsbyImage
              image={getImage(data.rollup)!}
              alt=""
              style={{ width: "100%" }}
              objectFit="contain"
            />
          </Center>
        </TwoColumnContent>
        <TwoColumnContent>
          {rollupCards.map(
            ({ image, title, description, childSentence, childLink }) => (
              <Flex
                key={title}
                background="ednBackground"
                borderRadius="sm"
                border="1px"
                borderColor="lightBorder"
                p={6}
                flex={{ base: "100%", md: "50%" }}
                flexDirection="column"
                justifyContent="space-between"
              >
                <GatsbyImage
                  image={image!}
                  alt=""
                  objectPosition="0"
                  objectFit="contain"
                />
                <h3>{title}</h3>
                <p>{description}</p>
                <p>
                  <Link to={childLink}>{childSentence}</Link>
                </p>
              </Flex>
            )
          )}
        </TwoColumnContent>
      </ContentBox>
      {/* DYOR Section */}
      <ContentBox>
        <InfoBanner isWarning={true}>
          <h2>
            <Translation id="layer-2-dyor-title" />
          </h2>
          <p>
            <Translation id="layer-2-dyor-1" />
          </p>
          <p>
            <Translation id="layer-2-dyor-2" />
          </p>
          <p>
            <ButtonLink to="https://l2beat.com/?view=risk">
              <Translation id="layer-2-dyor-3" />
            </ButtonLink>
          </p>
        </InfoBanner>
      </ContentBox>
      {/* Use Layer 2 Section */}
      <ContentBox id="use-layer-2">
        <h2>
          <Translation id="layer-2-use-layer-2-title" />
        </h2>
        <p>
          <Translation id="layer-2-use-layer-2-1" />
        </p>
        <p>
          <Translation id="layer-2-contract-accounts" />
        </p>
        <h3>
          <Translation id="layer-2-use-layer-2-generalized-title" />
        </h3>
        <p>
          <Translation id="layer-2-use-layer-2-generalized-1" />
        </p>
        <SimpleGrid
          templateColumns="repeat(auto-fit, minmax(280px, 1fr))"
          gap={8}
        >
          {layer2DataCombined
            .filter((l2) => !l2.purpose.indexOf("universal"))
            .map((l2, idx) => {
              return (
                <Layer2ProductCard
                  key={idx}
                  background={l2.background}
                  image={getImage(data[l2.imageKey])!}
                  description={translateMessageId(
                    l2.descriptionKey as TranslationKey,
                    intl
                  )}
                  url={l2.website}
                  note={translateMessageId(l2.noteKey as TranslationKey, intl)}
                  name={l2.name}
                  bridge={l2.bridge}
                  ecosystemPortal={l2.ecosystemPortal}
                  tokenLists={l2.tokenLists}
                >
                  {l2.purpose.map((purpose, index) => (
                    <Badge key={index} me={2}>
                      {purpose}
                    </Badge>
                  ))}
                </Layer2ProductCard>
              )
            })}
        </SimpleGrid>
      </ContentBox>
      {/* Layer 2 App Specific Section */}
      <ContentBox id="use-layer-2">
        <h3>
          <Translation id="layer-2-use-layer-2-application-specific-title" />
        </h3>
        <p>
          <Translation id="layer-2-use-layer-2-application-specific-1" />
        </p>
        <SimpleGrid
          templateColumns="repeat(auto-fit, minmax(280px, 1fr))"
          gap={8}
        >
          {layer2DataCombined
            .filter((l2) => l2.purpose.indexOf("universal"))
            .map((l2, idx) => {
              return (
                <Layer2ProductCard
                  key={idx}
                  background={l2.background}
                  image={getImage(data[l2.imageKey])!}
                  description={translateMessageId(
                    l2.descriptionKey as TranslationKey,
                    intl
                  )}
                  url={l2.website}
                  note={translateMessageId(l2.noteKey as TranslationKey, intl)}
                  name={l2.name}
                  bridge={l2.bridge}
                  ecosystemPortal={l2.ecosystemPortal}
                  tokenLists={l2.tokenLists}
                >
                  {l2.purpose.map((purpose, index) => (
                    <Badge key={index} me={2}>
                      {purpose}
                    </Badge>
                  ))}
                </Layer2ProductCard>
              )
            })}
        </SimpleGrid>
      </ContentBox>
      {/* Layer 2 Sidechain Section */}
      <ContentBox>
        <h2>
          <Translation id="layer-2-sidechains-title" />
        </h2>
        <TwoColumnContent>
          <Box flex="50%">
            <p>
              <Translation id="layer-2-sidechains-1" />
            </p>
            <p>
              <Translation id="layer-2-sidechains-2" />
            </p>
            <p>
              <Link to="/developers/docs/scaling/sidechains/">
                <Translation id="layer-2-more-on-sidechains" />
              </Link>
            </p>
            <p>
              <Link to="/developers/docs/scaling/validium/">
                <Translation id="layer-2-more-on-validiums" />
              </Link>
            </p>
          </Box>
          <Box flex="50%">
            <p>
              <Translation id="layer-2-sidechains-4" />
            </p>
            <p>
              <Translation id="layer-2-sidechains-5" />
            </p>
          </Box>
        </TwoColumnContent>
      </ContentBox>
      {/* Layer 2 Onboard Section */}
      <ContentBox id="how-to-get-onto-layer-2">
        <Layer2Onboard
          layer2DataCombined={layer2DataCombined}
          ethIcon={getImage(data.ethHome)!}
          ethIconAlt={translateMessageId("ethereum-logo", intl)}
        />
      </ContentBox>
      {/* Layer 2 Tools Section */}
      <ContentBox>
        <h2>
          <Translation id="layer-2-tools-title" />
        </h2>
        <TwoColumnContent>
          <Box flex="50%">
            <ProductList
              category="Information"
              content={toolsData.information}
            />
          </Box>
          <Box flex="50%">
            <ProductList
              category="Wallet managers"
              content={toolsData.walletManagers}
            />
          </Box>
        </TwoColumnContent>
      </ContentBox>
      {/* Layer 2 FAQ Section */}
      <ContentBox>
        <h2>
          <Translation id="layer-2-faq-title" />
        </h2>
        <ExpandableCard
          title={`${translateMessageId("layer-2-faq-question-1-title", intl)}`}
        >
          <p>
            <Translation id="layer-2-faq-question-1-description-1" />
          </p>
        </ExpandableCard>
        <ExpandableCard
          title={`${translateMessageId("layer-2-faq-question-2-title", intl)}`}
        >
          <p>
            <Translation id="layer-2-faq-question-2-description-1" />
          </p>
          <p>
            <Translation id="layer-2-faq-question-2-description-2" />
          </p>
          <p>
            <Translation id="layer-2-faq-question-2-description-3" />
          </p>
          <p>
            <Link to="/developers/docs/scaling/optimistic-rollups/">
              <Translation id="layer-2-more-info-on-optimistic-rollups" />
            </Link>
          </p>
          <p>
            <Link to="/developers/docs/scaling/zk-rollups/">
              <Translation id="layer-2-more-info-on-zk-rollups" />
            </Link>
          </p>
        </ExpandableCard>
        <ExpandableCard
          title={`${translateMessageId("layer-2-faq-question-3-title", intl)}`}
        >
          <p>
            <Translation id="layer-2-faq-question-3-description-1" />{" "}
          </p>
          <p>
            <Link to="/upgrades/sharding/">
              <Translation id="layer-2-more-on-sharding" />
            </Link>
          </p>
        </ExpandableCard>
        <ExpandableCard
          title={`${translateMessageId("layer-2-faq-question-4-title", intl)}`}
        >
          <p>
            <Translation id="layer-2-faq-question-4-description-1" />
          </p>
          <p>
            <Translation id="layer-2-faq-question-4-description-2" />
          </p>
          <p>
            <Translation id="layer-2-faq-question-4-description-3" />{" "}
          </p>
          <p>
            <Link to="/bridges/">
              <Translation id="layer-2-more-on-bridges" />
            </Link>
          </p>
        </ExpandableCard>
        <ExpandableCard
          title={`${translateMessageId("layer-2-faq-question-5-title", intl)}`}
        >
          <p>
            <Translation id="layer-2-faq-question-5-description-1" />{" "}
            <Link to="/contributing/adding-layer-2s/">
              <Translation id="layer-2-faq-question-5-view-listing-policy" />
            </Link>
          </p>
          <p>
            <Translation id="layer-2-faq-question-5-description-2" />
          </p>
        </ExpandableCard>
      </ContentBox>
      {/* Layer 2 Further Reading Section */}
      <ContentBox>
        <h2>
          <Translation id="layer-2-further-reading-title" />
        </h2>
        <UnorderedList ms="1.45rem" mb="1.45rem">
          <ListItem>
            <Link to="https://ethereum-magicians.org/t/a-rollup-centric-ethereum-roadmap/4698">
              <Translation id="a-rollup-centric-ethereum-roadmap" />
            </Link>{" "}
            <i>- Vitalik Buterin </i>
          </ListItem>
          <ListItem>
            <Link to="https://vitalik.ca/general/2021/01/05/rollup.html">
              <Translation id="an-incomplete-guide-to-rollups" />
            </Link>{" "}
            <i>- Vitalik Buterin</i>
          </ListItem>
          <ListItem>
            <Link to="https://www.youtube.com/watch?v=DyNbmgkyxJI">
              <Translation id="polygon-sidechain-vs-ethereum-rollups" />
            </Link>{" "}
            <i>- Lex Clips</i>
          </ListItem>
          <ListItem>
            <Link to="https://www.youtube.com/watch?v=7pWxCklcNsU">
              <Translation id="rollups-the-ultimate-ethereum-scaling-strategy" />
            </Link>{" "}
            <i>- Finematics</i>
          </ListItem>
          <ListItem>
            <Link to="/upgrades/sharding/">
              <Translation id="scaling-layer-1-with-shard-chains" />
            </Link>
          </ListItem>
          <ListItem>
            <Link to="https://barnabe.substack.com/p/understanding-rollup-economics-from?s=r">
              <Translation id="understanding-rollup-economics-from-first-principals" />
            </Link>{" "}
            <i>- Barnabé Monnot</i>
          </ListItem>
        </UnorderedList>
      </ContentBox>
      {/* Layer 2 Quiz Section */}
      <ContentBox>
        <QuizWidget quizKey="layer-2" />
      </ContentBox>
      {/* Layer 2 Feedback Section */}
      <ContentBox>
        <FeedbackCard />
      </ContentBox>
    </Flex>
  )
}

export default Layer2Page

export const query = graphql`
  query Layer2Page {
    dao: file(relativePath: { eq: "use-cases/dao-2.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 500
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    doge: file(relativePath: { eq: "doge-computer.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 624
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    ethBlocks: file(relativePath: { eq: "developers-eth-blocks.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 624
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    ethHome: file(relativePath: { eq: "eth-home-icon.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 50
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    financeTransparent: file(relativePath: { eq: "finance_transparent.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 300
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    heroImage: file(relativePath: { eq: "layer-2/hero.png" }) {
      childImageSharp {
        gatsbyImageData(layout: CONSTRAINED, placeholder: BLURRED, quality: 100)
      }
    }
    impact: file(relativePath: { eq: "impact_transparent.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 300
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    optimisticRollup: file(
      relativePath: { eq: "layer-2/optimistic_rollup.png" }
    ) {
      childImageSharp {
        gatsbyImageData(
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
          width: 122
        )
      }
    }
    rollup: file(relativePath: { eq: "layer-2/rollup-2.png" }) {
      childImageSharp {
        gatsbyImageData(layout: CONSTRAINED, placeholder: BLURRED, quality: 100)
      }
    }
    zkRollup: file(relativePath: { eq: "layer-2/zk_rollup.png" }) {
      childImageSharp {
        gatsbyImageData(
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
          width: 122
        )
      }
    }
    whatIsEthereum: file(relativePath: { eq: "what-is-ethereum.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 624
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    arbitrum: file(relativePath: { eq: "layer-2/arbitrum.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    aztec: file(relativePath: { eq: "layer-2/aztec.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 200
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    boba: file(relativePath: { eq: "layer-2/boba.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    chainlist: file(relativePath: { eq: "layer-2/chainlist.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    debank: file(relativePath: { eq: "layer-2/debank.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }

    l2beat: file(relativePath: { eq: "layer-2/l2beat.jpg" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    loopring: file(relativePath: { eq: "layer-2/loopring.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    metis: file(relativePath: { eq: "layer-2/metis-dark.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    optimism: file(relativePath: { eq: "layer-2/optimism.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    zapper: file(relativePath: { eq: "layer-2/zapper.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    zerion: file(relativePath: { eq: "layer-2/zerion.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    zkspace: file(relativePath: { eq: "layer-2/zkspace.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
    zksync: file(relativePath: { eq: "layer-2/zksync.png" }) {
      childImageSharp {
        gatsbyImageData(
          width: 100
          layout: CONSTRAINED
          placeholder: BLURRED
          quality: 100
        )
      }
    }
  }
`
