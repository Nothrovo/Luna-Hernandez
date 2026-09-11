# Addon workflow catalog

## Status asimilasi Midas (2026-09-11)

Catalog ini adalah bahan referensi, bukan daftar dependency. Implementasi mengambil pola yang berguna lalu mengganti layanan berbayar/berat dengan provider gratis atau kalkulasi lokal.

| Pola dari catalog | Keputusan | Implementasi Midas |
|---|---|---|
| Automated Stock Analysis Reports: teknikal + news + LLM | Diterapkan | `/stock`, MTF deterministik, Google News 48 jam, satu sintesis Gemini |
| Stock/futures market screener | Diterapkan | `/rec stock` memakai bounded watchlist; `/rec futures` memakai liquidity prefilter sebelum kalkulasi 4H/OI |
| Technical stock analysis via Telegram/Airtable | Konsep diterapkan | Telegram dipertahankan; Airtable tidak ditambah karena SQLite sudah cukup |
| AI Crew fundamental stock analysis | Konsep disederhanakan | Tidak memakai multi-agent runtime; SEC XBRL dihitung deterministik lalu Gemini hanya menarasikan |
| Earnings-report RAG | Ditunda | Membutuhkan ingestion dokumen/embedding dan belum perlu untuk command on-demand |
| Stock sentiment dengan EODHD/layanan berita | Konsep diterapkan | Google News RSS dipakai sebagai sumber opsional tanpa menambah subscription |
| FinnHub + Google Sheets DCF | Rumus diasimilasi | Rasio dan DCF bear/base/bull dihitung lokal dari SEC Company Facts; tanpa FinnHub/Sheets |
| Binance market alert / futures analytics | Sebagian diterapkan | Candle USD-M, mark/index, funding, OI, dan crowding; tanpa API key/order execution |
| Screenshot/vision chart analysis | Tidak diterapkan | OHLCV terstruktur lebih mudah diuji dan tidak memerlukan browser/extension |
| Weekly report otomatis | Ditunda | Jalur on-demand dibuat dahulu; scheduler baru layak setelah kualitas hasil terukur |

Provider runtime saat ini: CoinGecko untuk crypto spot, Alpaca Basic/IEX + SEC EDGAR untuk saham AS, Binance USD-M public market data untuk perpetual futures, dan Google News RSS untuk headline. Detail formula ada di `Calculations.md`.

---

Top 294 Crypto Trading automation workflows
Crypto Trading
AI
Sales
IT Ops
Marketing
Document Ops
Other
Support

Results (294)
Automated Stock Analysis Reports with Technical & News Sentiment using GPT-4o
Created by: Elay Guez || elay96
Elay Guez

⋅a year ago⋅Free
Stock Analysis Agent (Hebrew, RTL, GPT-4o) Overview Get comprehensive stock analysis with this AI-powered workflow that provides actionable insights for your investment decisions. On a weekly basis, this workflow: Analyzes stock data from multiple sources (Chart-img, Twelve Data API, Alphavantage) Performs technical analysis usi...

    Send Email
    HTTP Request
    Code
    +8

Analyze tradingview.com charts with Chrome extension, N8N and OpenAI
Created by: Hans Blaauw || thingsio
Hans Blaauw

⋅2 years ago⋅Free
This flow is supported by a Chrome plugin created with Cursor AI. The idea was to create a Chrome plugin and a backend service in N8N to do chart analytics with OpenAI. It's a good sample on how to submit a screenshot from the browser to N8N. Who is it for? N8N developers who want to learn about using a Chrome plugin, an N8N webh...

    OpenAI

AI Crew to Automate Fundamental Stock Analysis - Q&A Workflow
Created by: Derek Cheung || derekcheungsa
Derek Cheung

⋅2 years ago⋅Free
How it works: Using a Crew of AI agents (Senior Researcher, Visionary, and Senior Editor), this crew will automatically determine the right questions to ask to produce a detailed fundamental stock analysis. This application has two components: a front-end and a Stock Q&A engine. The front end is the team of agents automaticall...

    Google Drive
    Question and Answer Chain
    Binary Input Loader
    +5

Analyze Crypto Markets with the AI-Powered CoinMarketCap Data Analyst
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Meet your AI-powered crypto data analyst—fully integrated with CoinMarketCap APIs. This workflow acts as the supervisor agent for a multi-agent architecture built in n8n, connecting three powerful sub-agents to extract real-time insights from centralized and decentralized markets. It’s the ultimate tool for crypto traders, analy...

    Telegram
    AI Agent
    OpenAI Chat Model
    +2

Technical stock analysis with Telegram, Airtable and a GPT-powered AI Agent
Created by: Mark Shcherbakov || lowcodingdev
Mark Shcherbakov

⋅2 years ago⋅Free
Video Guide I prepared a detailed guide that demonstrates the complete process of building a trading agent automation using n8n and Telegram, seamlessly integrating various functions for stock analysis. Youtube Link Who is this for? This workflow is perfect for traders, financial analysts, and developers looking to automate st...

    Airtable
    HTTP Request
    Telegram
    +5

AI-Powered RAG Workflow For Stock Earnings Report Analysis
Created by: Mihai Farcas || mihailtd
Mihai Farcas

⋅2 years ago⋅Free
This n8n workflow creates a financial analysis tool that generates reports on a company's quarterly earnings using the capabilities of OpenAI GPT-4o-mini, Google's Gemini AI and Pinecone's vector search. By analyzing PDFs of any company's earnings reports from their Investor Relations page, this workflow can answer complex financia...

    Google Sheets
    Google Drive
    Google Docs
    +8

Crypto Market Alert System with Binance and Telegram Integration
Created by: Nskha || nskha
Nskha

⋅3 years ago⋅Free
An innovative N8N workflow that monitors cryptocurrency prices on Binance, identifies significant market movements, and sends customized alerts through Telegram. Ideal for traders and enthusiasts seeking real-time market insights. How It Works Trigger Options: Choose between a manual trigger or a scheduled trigger to start the wo...

    HTTP Request
    Telegram
    Code

AI-powered automated stock analysis
Created by: Derek Cheung || derekcheungsa
Derek Cheung

⋅2 years ago⋅$25
Introduction: Streamline your fundamental stock analysis process with AI-powered automation. By harnessing the power of SEC 10K reports - comprehensive documents required by the SEC containing vital company information - this template automates the analysis workflow. From planning by a Senior Research Analyst to execution by ...

    Google Docs
    Code
    Code Tool
    +2

Get Real-time Crypto Token Insights via Telegram with DexScreener and GPT-4o
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Instantly access real-time decentralized exchange (DEX) insights directly in Telegram! This workflow integrates the DexScreener API with GPT-4o-powered AI and Telegram, allowing users to fetch the latest blockchain token analytics, liquidity pools, and trending tokens effortlessly. Ideal for crypto traders, DeFi analysts, and inves...

    Telegram
    AI Agent
    OpenAI Chat Model
    +2

📈 Receive Daily Market News from FT.com to your Microsoft outlook inbox
Created by: Louis || louisdl
Louis

⋅2 years ago⋅$3
📈 Daily Financial News - Description This workflow automates the process of collecting, organizing, and delivering a daily summary of financial news by following these key steps: Scheduled Activation The workflow starts at 7:00 AM each day, triggered by the Schedule Trigger node. News Retrieval The HTTP Request node ...

    HTTP Request
    Microsoft Outlook
    HTML
    +2

Real-time Crypto News & Sentiment Analysis via Telegram with GPT-4o
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Stay on top of the latest crypto news and market sentiment instantly, all inside Telegram! This workflow aggregates articles from the top crypto news sources, filters for your topic of interest, and summarizes key news and market sentiment using GPT-4o AI. Ideal for crypto traders, investors, analysts, and market watchers needing...

    Telegram
    Code
    AI Agent
    +2

Stock Market Technical Analysis with GPT-4o and TradingView for Telegram
Created by: Badr || b4dr
Badr

⋅a year ago⋅$38
Overview: Transform Your Trading with AI-Driven Technical Analysis The Stock Market Technical Analysis Bot is an advanced n8n workflow that brings professional-grade stock analysis to Telegram users. This powerful AI agent analyzes stock charts in real-time, providing detailed technical insights that would typically require expen...

    HTTP Request
    Telegram
    Code
    +5

AI-Powered Stock Market Summary Bot
Created by: kenandrewmiranda || kenandrewmiranda
kenandrewmiranda

⋅a year ago⋅Free
An automated n8n workflow that analyzes stocks using RSI and MACD, summarizes insights with OpenAI, and sends a Slack-ready market update every hour. This workflow: Runs hourly from 6:30 AM to 2:30 PM PT, Mon–Fri Checks if the U.S. stock market is open using Alpaca’s /clock API Pulls daily stock bars for a list of tickers via Alpa...

    HTTP Request
    Slack
    Code
    +1

CoinMarketCap Telegram Price Bot
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Get real-time cryptocurrency prices directly in Telegram! This workflow integrates CoinMarketCap API with Telegram, allowing users to request live crypto prices simply by sending a message to the bot. Ideal for crypto traders, analysts, and enthusiasts who need quick and easy access to market data. How It Works A Telegram bot ...

    Telegram
    AI Agent
    OpenAI Chat Model
    +2

Get Live Crypto Market Data with AI-Powered CoinMarketCap Agent
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Access real-time cryptocurrency prices, market rankings, metadata, and global stats—powered by GPT-4o and CoinMarketCap! This modular AI-powered agent is part of a broader CoinMarketCap multi-agent system designed for crypto analysts, traders, and developers. It uses the CoinMarketCap API and intelligently routes queries to the c...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Track investments using Baserow and n8n
Created by: Tom || mutedjam
Tom

⋅4 years ago⋅Free
This workflow uses a number of technologies to track the value of ETFs, stocks and other exchange-traded products: Baserow: To keep track of our investments n8n’s Cron node: To trigger the workflow compiling our daily morning briefing Webscraping: The HTTP Request & HTML Extract nodes to fetch up-to-date prices from the relevant s...

    HTTP Request
    SendGrid
    Baserow

TradingView Signal Extractor with Gmail, Google Sheets & Telegram Notifications
Created by: Dhrumil Patel || itechdp
Dhrumil Patel

⋅a year ago⋅Free
Stay ahead in your trading game with this powerful n8n automation workflow. Designed for real-time efficiency, this setup continuously scans your Gmail inbox for trading alerts from TradingView and ensures you never miss a signal. Every minute, this workflow will: 📩 Check Gmail for new messages using a trigger. 🔍 Identify email...

    Google Sheets
    Telegram
    Gmail
    +1

Stock Technical Analysis with Google Gemini
Created by: Udit Rawat || ailistmaster
Udit Rawat

⋅2 years ago⋅$10
The purpose of this workflow, "Sell: Stock Vision," is to create an AI-powered technical analysis agent capable of analyzing financial charts for equity stocks and cryptocurrencies. This workflow provides users with actionable insights into market trends, price movements, candlestick patterns, and technical indicators to support in...

    HTTP Request
    AI Agent
    Simple Memory
    +2

Analyze Crypto Market with CoinGecko: Volatility Metrics & Investment Signals
Created by: ist00dent || ist00dent
ist00dent

⋅a year ago⋅Free
This n8n template lets you automatically pull market data for the cryptocurrencies from CoinGecko every hour, calculate custom volatility and market-health metrics, classify each coin’s price action into buy/sell/hold/neutral signals with risk ratings, and expose both individual analyses and a portfolio summary via a webhook. It’s ...

    HTTP Request

Analyze DEX Liquidity, Trades & Spot Pairs with CoinMarketCap AI Agent
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Gain full visibility into decentralized exchanges using CoinMarketCap’s DEXScan API—powered by AI. This workflow is part of the CoinMarketCap AI Analyst system and delivers real-time and historical insights on spot trading pairs, DEX liquidity, trading activity, and OHLCV data across chains like Ethereum, Polygon, Solana, and mo...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Tesla Quant Trading AI Agent using Telegram + GPT-4.1 (Main InterFace)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📈 Get daily and on-demand Tesla (TSLA) trading signals via Telegram—powered by GPT-4.1 and real-time market data. This is the central AI supervisor that orchestrates seven sub-agents for technical analysis, price pattern recognition, and news sentiment. Reports are delivered in structured Telegram-ready HTML, optimized for traders...

    Telegram
    Code
    AI Agent
    +3

Analyze Crypto News Sentiment for Any Token with GPT-4o and Telegram Alerts
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A sentiment intelligence sub-agent for the Binance Spot Market Quant AI Agent. It aggregates crypto news from major sources, filters by token keyword (e.g., BTC, ETH), and produces a Telegram-ready summary including market sentiment and top headlines—powered by GPT-4o. 🎥 Live Demo: 🛠️ Workflow Function This tool performs the f...

    Code
    AI Agent
    OpenAI Chat Model
    +1

Binance Spot Market Quant AI Agent | GPT-4o + Telegram (Main Interface)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A professional-grade AI automation system for spot market trading insights on Binance. It analyzes multi-timeframe technical indicators, live price/order data, and crypto sentiment, then delivers fully formatted Telegram-style trading reports. 🎥 Watch Tutorial: 🧩 Required Workflows You must install and activate all of the foll...

    Telegram
    Code
    AI Agent
    +3

AI-Powered Stock Analysis Assistant with Telegram, Claude & GPT-4O Vision
Created by: Femi Ad || hgray
Femi Ad

⋅a year ago⋅Free
"Ade Technical Analyst" is a dual-workflow AI system combining conversational intelligence with visual chart analysis through Telegram. The system features 11 primary nodes for conversation management and 8 secondary nodes for chart generation and analysis. Core Components: Telegram Integration: Message handling with dynamic typi...

    HTTP Request
    Telegram
    AI Agent
    +4

AI-Powered Crypto Analysis Using OpenRouter, Gemini, and SerpAPI
Created by: Udit Rawat || ailistmaster
Udit Rawat

⋅2 years ago⋅$25
This n8n automation is designed to analyze cryptocurrency trends by extracting, processing, and interpreting candlestick charts using AI-powered agents. The workflow enhances technical analysis by integrating real-time market data, ensuring traders receive accurate and actionable insights. Workflow Breakdown: 🔹 1. Chat Node – Pr...

    HTTP Request
    AI Agent
    Simple Memory
    +1

Provide latest euro exchange rates from European Central Bank via Webhook
Created by: Monospace Design || mnspc
Monospace Design

⋅3 years ago⋅Free
What is this workflow doing? This simple workflow is pulling the latest Euro foreign exchange reference rates from the European Central Bank and responding expected values to an incoming HTTP request (GET) via a Webhook trigger node. Setup no authentication** needed the workflow is ready to use test** the workflow template by hitt...

    HTTP Request

Tracking your crypto portfolio in Airtable
Created by: jason || tephlon
jason

⋅6 years ago⋅Free
If you have made some investments in cryptocurrency, this workflow will allow you to create an Airtable base that will update the value of your portfolio every hour. You can then track how well your investments are doing. You can check out my Airtable base to see how it works or even copy my base so that you can customize this w...

    Airtable
    CoinGecko

Get the price of BTC in EUR and send an SMS
Created by: Harshil Agrawal || harshil1712
Harshil Agrawal

⋅6 years ago⋅Free
This workflow allows you to get the price of BTC in EUR and send an SMS when the price is larger than EUR 9000

    Twilio
    CoinGecko

Smart stock trading recommendations with GPT-4, TwelveData & NewsAPI analysis
Created by: Jitesh Dugar || jiteshdugar
Jitesh Dugar

⋅a year ago⋅Free
Smart Stock Trading Recommendations with GPT-4, TwelveData & NewsAPI What It Does This template automates stock analysis by combining technical analysis, news sentiment, and real-time market data to generate actionable trading recommendations with confidence scores, risk management parameters, and entry/exit levels. Why It's Usef...

    HTTP Request
    Code
    AI Agent
    +3

Get Exchange & Sentiment Insights with CoinMarketCap AI Agent
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Analyze exchange data, market indexes, and community sentiment from CoinMarketCap—powered by AI. This sub-agent provides access to exchange listings, token holdings, metadata, and high-level metrics like the CMC 100 Index and the Fear & Greed Index. It’s designed for use within your larger CoinMarketCap AI Analyst system or as a...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Binance Spot Trader - Limit & Market Orders via API
Created by: Todsaporn Sangboon || nolifelover
Todsaporn Sangboon

⋅a year ago⋅Free
📈 How it works This n8n workflow allows you to interact with Binance Spot Trading API directly to: Place Limit Buy and Limit Sell orders Place Market Buy and Market Sell orders Query account info* and open orders* Cancel all open orders** for a specific symbol All requests are signed using Binance's HMAC SHA256 signature method ...

    HTTP Request
    Crypto
    Code

Send Hourly Crypto Market Analysis from Binance to Telegram
Created by: Aurélien P. || aurelienpp
Aurélien P.

⋅a year ago⋅Free
📈 Daily Crypto Market Summary Bot (Binance to Telegram) This workflow fetches 24h price change data from Binance for selected crypto pairs (BTC/USDC, ETH/USDC, SOL/USDC) every hour using a cron schedule. It performs in-depth analysis—including volatility, volume, bid-ask spread, momentum, and market comparison—then formats a de...

    HTTP Request
    Telegram

USDT And TRC20 Wallet Tracker API Workflow for n8n
Created by: Nskha || nskha
Nskha

⋅3 years ago⋅Free
Overview This n8n workflow is specifically designed to monitor USDT TRC20 transactions within a specified wallet. It utilizes the public blockchain database of TronScan, requiring no API authentication, to periodically check and process transaction data. This workflow is ideal for users who need an automated solution to track the...

    HTTP Request

Analyze Stock Charts with GPT-4 Vision and Send Results via Telegram
Created by: Fenngbrotalk || yihaohuang
Fenngbrotalk

⋅a year ago⋅Free
n8n Workflow: AI-Powered Stock Chart Analysis Bot for Telegram This is a powerful n8n automation workflow that integrates a Telegram bot with OpenAI's multimodal large language model (GPT-4 Vision) to provide users with real-time stock chart analysis. Workflow Breakdown Receive Image:** The workflow is initiated by a Telegram Tr...

    Edit Image
    Telegram
    Basic LLM Chain
    +2

AI-Powered Technical Analyst with Perplexity R1 Research
Created by: Derek Cheung || derekcheungsa
Derek Cheung

⋅a year ago⋅$40
Leverage the latest AI technology to analyze financial charts and make informed trading decisions with our Technical Analysis AI Agent. This powerful workflow combines Claude Sonnet 3.7 vision capabilities with Perplexity deep reasoning and up-to-date internet information to deliver comprehensive market analysis. Key Capabiliti...

    HTTP Request
    AI Agent
    Basic LLM Chain
    +4

AI-Powered Financial Chart Analyzer | OpenRouter, MarketStack, macOS Shortcuts
Created by: Udit Rawat || ailistmaster
Udit Rawat

⋅2 years ago⋅$30
The AI-Powered Financial Chart Analyzer is a cutting-edge automation tool that streamlines financial analysis using n8n workflows, AI agents, and MacOS Shortcuts. It enables users to capture, process, and analyze candlestick charts for both stocks and cryptocurrencies. By integrating powerful tools like ChatGPT-4o-mini (via OpenRou...

    AI Agent
    Simple Memory
    Calculator
    +1

US Stocks Earnings Calendar AI Updates to Telegram (Finnhub + Gemini)
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$15
Purpose & Audience This n8n workflow is designed for investors, traders, financial analysts, and community managers who want real-time, structured US stocks upcoming earnings calendar updates directly to their Telegram channels or chats. It’s perfect for anyone running a financial community, managing a trading group, or tracking ea...

    HTTP Request
    Telegram
    Code
    +3

Stock Market Daily Digest with Bright Data Scraping & Gemini AI Email Reports
Created by: Zacharia Kimotho || imperolq
Zacharia Kimotho

⋅a year ago⋅Free
This workflow makes it easier to keep track of the stocks market and get an email with a summary of the daily highlights on what happened, key insights and trends Setup Guide Define the schedule (days, times, intervals). Replace sample stock data with your desired stock list (ticker, name, etc.) in JSON format. Split Out the fi...

    Google Sheets
    HTTP Request
    AI Agent
    +1

Analyze crypto markets via Telegram with KuCoin, NewsAPI and Gemini
Created by: Blukaze Automations || hellopaul
Blukaze Automations

⋅9 months ago⋅$9
This n8n template automates crypto market analysis by combining multi-timeframe candlestick data with real-time news sentiment to generate actionable AI-backed Buy / Sell / Hold signals for any cryptocurrency. Built around the Kaizen principle of continuous improvement, it delivers sharper, more reliable insights with every run. U...

    HTTP Request
    Telegram
    Code
    +3

Forex News & Sentiment Telegram Alerts
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose & Audience This n8n workflow template is designed for Forex traders, analysts, and enthusiasts who want to automate the process of staying updated on the latest news and sentiment for any currency pair. By leveraging advanced news aggregation and sentiment analysis, the workflow delivers concise, actionable updates directl...

    Telegram
    Code
    AI Agent
    +1

Get Binance Spot Market Financial Analysis via Telegram with GPT-4o
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
This workflow powers the Binance Spot Market Quant AI Agent, acting as the Financial Market Analyst. It fuses real-time market structure data (price, volume, kline) with multiple timeframe technical indicators (15m, 1h, 4h, 1d) and returns a structured trading outlook—perfect for intraday and swing traders who want actionable analy...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Tesla News and Sentiment Analyst Tool (Powered by DeepSeek Chat)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📰 This AI-powered agent performs real-time sentiment analysis on Tesla (TSLA) news to support trading decisions. It aggregates headlines from 5 trusted sources and uses DeepSeek Chat to classify sentiment and generate structured summaries. This tool is a critical sub-agent in the broader Tesla Quant Trading AI Agent system. ⚠️ N...

    AI Agent
    Simple Memory
    DeepSeek Chat Model

Tesla Financial Market Data Analyst Tool (Multi-Timeframe Technical AI Agent)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📊 This AI sub-agent aggregates Tesla (TSLA) trading signals across multiple timeframes using real-time technical indicators and candlestick behavior. It is a core component of the Tesla Quant Trading AI system. Powered by GPT-4.1, it consolidates 15-minute, 1-hour, and 1-day indicators, adds candlestick pattern data, and produces ...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

🏛️ Daily US Congress Members Stock Trades Report via Firecrawl + OpenAI + Gmail
Created by: Automate With Marc || marconi
Automate With Marc

⋅a year ago⋅Free
📬 What This Workflow Does This workflow automatically scrapes recent high-value congressional stock trades from Quiver Quantitative, summarizes the key transactions, and delivers a neatly formatted report to your inbox — every single day. It combines Firecrawl's powerful content extraction, OpenAI's GPT formatting, and n8n's auto...

    HTTP Request
    Gmail
    Code
    +1

Automate Cryptocurrency Funding Fee Tracking with Binance API and Airtable
Created by: Mark Shcherbakov || lowcodingdev
Mark Shcherbakov

⋅a year ago⋅Free
Video Guide I prepared a detailed guide that showed the whole process of integrating the Binance API and storing data in Airtable to manage funding statements associated with tokens in a wallet. Youtube Link Who is this for? This workflow is ideal for developers, financial analysts, and cryptocurrency enthusiasts who want to a...

    Airtable
    HTTP Request
    Crypto

Monitor USDT ERC-20 Wallet Balance with Etherscan and Telegram Notifications
Created by: FORK SOFTWARE TECHNOLOGIES INC. || fork
FORK SOFTWARE TECHNOLOGIES INC.

⋅a year ago⋅Free
Overview This n8n workflow is specifically designed to monitor the USDT ERC-20 balance within a specific wallet. It uses Etherscan's public blockchain database, which does not require API authentication, to periodically check and process transaction data. This workflow is ideal for users who need an automated solution to track ER...

    HTTP Request
    Telegram
    Code

Post Hourly Crypto Market Summaries via Coingecko to X and to Email
Created by: Badr || b4dr
Badr

⋅2 years ago⋅$5
Description This workflow, delivers real-time cryptocurrency market updates (default: Bitcoin) by fetching data from the CoinGecko API. It formats the information into a visually engaging message and shares it on X (formerly Twitter) and via email. The workflow is set to trigger hourly but is fully customizable to suit different ...

    HTTP Request
    X (Formerly Twitter)
    Gmail
    +1

Binance SM 15min Indicators Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A short-term technical analysis agent for 15-minute candles on Binance Spot Market pairs. Calculates and interprets key trading indicators (RSI, MACD, BBANDS, ADX, SMA/EMA) and returns structured summaries, optimized for Telegram or downstream AI trading agents. This tool is designed to be triggered by another workflow (such as th...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Currency Conversion Workflow
Created by: Mauricio Perera || rckflr
Mauricio Perera

⋅2 years ago⋅$25
Purpose: This workflow exemplifies a sophisticated yet pragmatic mechanism for automating currency conversions by leveraging simple HTTP queries routed through a webhook. By intercepting user requests, sourcing real-time exchange rate data via Google search results, and formatting the data into actionable responses, it obviates the...

    HTTP Request
    HTML

Get Real-time NFT Marketplace Insights with OpenSea Marketplace Agent Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Track NFT listings, offers, orders, and trait-based pricing in real time! This workflow integrates OpenSea API, AI-powered analytics (GPT-4o-mini), and n8n automation to provide instant insights into NFT trading activity. Ideal for NFT traders, collectors, and investors looking to monitor the market and identify profitable opportun...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Check Tron Wallet USDT Blacklist Status via Telegram
Created by: FORK SOFTWARE TECHNOLOGIES INC. || fork
FORK SOFTWARE TECHNOLOGIES INC.

⋅a year ago⋅Free
Description This n8n workflow template allows users to check if a Tron wallet address is blacklisted on the USDT contract via a Telegram bot. When a user sends the command {walletAddress} through the Telegram bot, the workflow queries the Tronscan API to determine if the provided wallet address is blacklisted. The result is then s...

    HTTP Request
    Telegram
    Code

Binance SM Indicators Webhook Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
This workflow acts as a central API gateway for all technical indicator agents in the Binance Spot Market Quant AI system. It listens for incoming webhook requests and dynamically routes them to the correct timeframe-based indicator tool (15m, 1h, 4h, 1d). Designed to power multi-timeframe analysis at scale. 🎥 Watch Tutorial: 🎯...

    HTTP Request
    Code

Crypto RSI Alert System with EODHD, Telegram and TradingView Charts
Created by: Kevin Meneses || pythonia-kevin
Kevin Meneses

⋅a year ago⋅Free
How it works Runs on a schedule and iterates a watchlist of symbols (e.g., BTC/ETH/SOL). For each symbol, request intraday 1h OHLCV from EODHD. A Code node computes Wilder’s RSI(14) and detects 30/70 crossings. When a signal appears, the bot sends a Telegram alert (HTML message) with price, RSI (prev → now), timestamp, and a “V...

    HTTP Request
    Telegram
    Code

Binance SM 1hour Indicators Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
🧪 Binance SM 1hour Indicators Tool A precision trading signal engine that interprets 1-hour candlestick indicators for Binance Spot Market pairs using a GPT-4.1-mini LLM. Ideal for swing traders seeking directional bias and momentum clarity across medium timeframes. 🎥 Watch Tutorial: 🎯 Purpose This tool provides a structured...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Send Cryptocurrency Price Threshold Alerts from CoinGecko to Discord
Created by: LukaszB || lukaszb
LukaszB

⋅a year ago⋅Free
Crypto Price Alert – n8n Workflow A simple and effective crypto alert system for anyone who wants to stay up to date with coin price changes — without refreshing charts all day. This workflow checks the current price of your chosen cryptocurrency (via CoinGecko) and sends you an alert on Discord if it goes above or below your targ...

    Discord
    CoinGecko

Binance SM Price-24hrStats-OrderBook-Kline Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A powerful sub-agent that collects real-time market structure data from Binance for any trading pair — including price, volume, order book depth, and candlestick snapshots across multiple timeframes (15m, 1h, 4h, 1d). 🎥 Watch Tutorial: 🎯 Purpose This workflow powers the Quant AI system with: ✅ Real-time price feed (/ticker/pr...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Analyze NFT Market Trends with AI-Powered OpenSea Analytics Agent Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Get deep insights into NFT market trends, sales data, and collection statistics—all powered by AI and OpenSea! This workflow connects GPT-4o-mini, OpenSea API, and n8n automation to provide real-time analytics on NFT collections, wallet transactions, and market trends. It is ideal for NFT traders, collectors, and investors looking ...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Binance SM 4hour Indicators Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A medium-term trend analyzer for the Binance Spot Market that leverages core technical indicators across 4-hour candle data to provide human-readable swing-trade signals via AI. 🎥 Watch Tutorial: 🎯 What It Does Accepts a Binance trading pair (e.g., AVAXUSDT) Sends the symbol to an internal webhook for technical indicator calcu...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Binance SM 1day Indicators Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
This advanced agent analyzes long-term price action in the Binance Spot Market using 1-day candles. It calculates key macro indicators like RSI, MACD, BBANDS, EMA, SMA, and ADX to identify high-confidence trend setups and market momentum. Used by the Quant AI system for directional bias and macro-level signal validation. 🎥 Watch ...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Tesla 15min Indicators Tool (Short-Term AI Technical Analysis)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
⏱️ Analyze Tesla (TSLA) short-term market structure and momentum using 6 technical indicators on the 15-minute timeframe. This AI agent tool is part of the Tesla Quant Trading AI Agent system. It is designed to detect intraday shifts in volatility, trend strength, and potential reversal signals. ⚠️ Not standalone. This agent is t...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Real-time stock insights using xAI
Created by: DevCode Journey || devcodejourney
DevCode Journey

⋅10 months ago⋅$3
Who is this for? This n8n workflow is designed for investors, financial analysts, automated trading system developers, and finance enthusiasts who require daily, comprehensive, data-driven insights into specific stock symbols. It's perfect for users who need to automate the complex process of combining technical indicators, news se...

    HTTP Request
    Telegram
    Code
    +4

AI-Powered automated news (stock, economy...) collector with expert comment
Created by: Nguyễn Thiệu Toàn (Jay Nguyen) || nguyenthieutoan
Nguyễn Thiệu Toàn (Jay Nguyen)

⋅10 months ago⋅$39
What is This Workflow? V2 (2026) available! An intelligent, fully automated news aggregation system that collects articles from multiple sources (RSS feeds + Google Search), uses AI to classify and summarize the most important stories, then delivers a professional HTML email report with expert commentary. Contact to customize this...

    Gmail
    Code
    AI Agent
    +4

Financial News Digest with Google Gemini AI to Outlook Email
Created by: Louis || louisdl
Louis

⋅a year ago⋅$5
🧠 Key Features Looping source scraping: Collects content from news sites you have selected (it might not work for all of them however) HTML extraction & cleaning: Parses, cleans, and filters messy website data to isolate only the most relevant content. AI-powered synthesis: Uses Google Gemini (via LangChain agent) to summarize an...

    HTTP Request
    Microsoft Outlook
    Code
    +3

Stock Market Information Assistant with Telegram, Yahoo Finance, and GPT-4 Nano
Created by: Archit Jain || architjn
Archit Jain

⋅a year ago⋅$25
How it works Listens to Telegram messages to detect stock-related queries. Extracts company name and identifies its exact stock ticker symbol. Searches Yahoo Finance for stock info using the ticker. Fetches and formats the latest stock data like price and key stats. Sends a clean, simplified reply back to the user on Telegram. Se...

    HTTP Request
    Telegram
    AI Agent
    +4

Tesla 1hour & 1day Klines Tool (Candlestick & Volume AI Pattern Detector)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📉 Detect key candlestick reversal patterns and volume divergence on Tesla (TSLA) using GPT-4.1 and real-time OHLCV data. This AI agent evaluates 1-hour and 1-day candles and is an essential part of the Tesla Financial Market Data Analyst Tool. It identifies signals like Doji, Engulfing, Hammer, and volume anomalies to support trad...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Receive Bitcoin, Etherium, Solana, Binance data with Gecko Coin and Gmail
Created by: Ghufran Ridhawi || ghufran-ridhawi
Ghufran Ridhawi

⋅a year ago⋅$5
Who is this for? This workflow is intended for Traders for trading, Crypto Investors, Professionals in Web 3, Web 3 Developers, Crypto Marketers, Web 3 Programmers, especially in the world of Crypto Currency, Blockchain, and all professionals working in the world of Web 3, including agencies or companies that use Web 3 data. Here y...

    HTTP Request
    Gmail
    Code

Generate AI stock trade recommendations from TwelveData, NewsAPI and Gemini via Telegram
Created by: Blukaze Automations || hellopaul
Blukaze Automations

⋅10 months ago⋅$9
Quick overview ZenTrade is an AI-powered trading assistant that combines multi-timeframe analysis, volume confirmation, and news sentiment to generate Buy, Sell, and Hold recommendations with market bias, risk assessment, and trade setups delivered directly to Telegram. How it works ZenTrade analyzes live market data across multip...

    HTTP Request
    Telegram
    Code
    +3

Get Real-time NFT Insights via Telegram with OpenSea & AI (Main Interface)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Track NFT market trends, collections, and trades in real time—directly from Telegram! This master workflow integrates the OpenSea API, GPT-4o-mini AI, and Telegram, allowing users to request natural-language NFT analytics and receive structured insights instantly. Whether you're an NFT trader, collector, or market analyst, this Te...

    Telegram
    AI Agent
    OpenAI Chat Model
    +2

📈 Hourly monitoring of crypto rates with Alpha Vantage API and Google Sheets
Created by: Samir Saci || samirsaci
Samir Saci

⋅a year ago⋅Free
Tags*: Crypto, Currency Exchange, Alpha Vantage API, Google Sheets Context Hi! I’m Samir Saci, a Supply Chain Engineer and Data Scientist based in Paris, and founder of LogiGreen Consulting. I help companies automate data pipelines using APIs, AI agents, and workflow automation to improve operational visibility and decision-mak...

    Google Sheets
    HTTP Request
    Telegram

Get Real-time NFT Insights with OpenSea AI-Powered NFT Agent Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Instantly access NFT metadata, collections, traits, contracts, and ownership details from OpenSea! This workflow integrates GPT-4o-mini AI, OpenSea API, and n8n automation to provide structured NFT data for traders, collectors, and investors. How It Works Receives user queries via Telegram, webhooks, or another connected inter...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Generate stock trading signals with Gemini 2.5 Pro & TwelveData via Telegram Bot
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose and Audience This n8n workflow template creates an intelligent stock technical analysis system that delivers professional-grade trading signals directly to your Telegram. Designed for retail traders, investors, and financial professionals who want to combine technical analysis with AI-powered insights for better market timi...

    HTTP Request
    Telegram
    Code
    +4

Fetch real-time Coinbase spot market data with GPT-4o + Telegram
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Coinbase AI Agent instantly fetches real-time market data directly in Telegram! This workflow integrates the Coinbase REST API with Telegram (plus optional AI-powered formatting) to deliver the latest crypto price, order book, candles, and trade stats in seconds. Perfect for crypto traders, analysts, and investors who want action...

    Telegram
    Code
    AI Agent
    +4

Analyze Cryptocurrency Market Data with HTX API, GPT-4o and Telegram
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A fully autonomous, HTX Spot Market AI Agent (Huobi AI Agent) built using GPT-4o and Telegram. This workflow is the primary interface, orchestrating all internal reasoning, trading logic, and output formatting. ⚙️ Core Features 🧠 LLM-Powered Intelligence: Built on GPT-4o with advanced reasoning ⏱️ Multi-Timeframe Support: 15m, 1...

    Telegram
    Code
    AI Agent
    +4

Tesla 1day Indicators Tool (Macro-Level Technical AI)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📅 Analyze Tesla’s daily trading structure with AI using 6 Alpha Vantage indicators. This tool evaluates long-term trend health, volatility patterns, and potential reversal signals at the 1-day timeframe. Designed for use within the Tesla Financial Market Data Analyst Tool, this agent helps swing and position traders anchor macro s...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Tesla 1hour Indicators Tool (Mid-Term Technical Analysis AI)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
🕒 Evaluate Tesla (TSLA) price action and market structure on the 1-hour timeframe using 6 real-time indicators. This sub-agent is designed to feed mid-term technical insights into the Tesla Financial Market Data Analyst Tool. It uses GPT-4.1 to interpret Alpha Vantage indicator data delivered via secure webhooks. ⚠️ This workflo...

    AI Agent
    OpenAI Chat Model
    Simple Memory

AAVE Portfolio Professional AI Agent | Telegram + Email + GPT-4o + Moralis
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A next-generation AI-powered DeFi health monitor that tracks wallet positions across Aave V3 using GPT-4o and LangChain. It delivers human-readable reports via Telegram and Gmail, triggered on schedule or manually. Built for professionals monitoring multiple DeFi wallets. 🧩 System Components | Component |...

    Google Sheets
    Telegram
    Gmail
    +3

Tesla Quant Technical Indicators Webhooks Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📡 This workflow serves as the central Alpha Vantage API fetcher for Tesla trading indicators, delivering cleaned 20-point JSON outputs for three timeframes: 15min, 1hour, and 1day. It is required by the following agents: Tesla 15min, 1h, 1d Indicators Tools Tesla Financial Market Data Analyst Tool ✅ Requires an Alpha Vantage Pr...

    HTTP Request
    Code

Forex, Crypto, Mergers and Financial Markets AI Analyst Updates to Telegram
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$35
Purpose & Audience: This workflow is designed for active traders, financial analysts, and market enthusiasts who want to stay informed about high-impact market news without information overload. It targets users interested in Forex, Crypto, Mergers, and general market-moving geopolitical news delivered directly to their Telegram ch...

    HTTP Request
    Telegram
    Code

Automated Stock Sentiment Analysis with Google Gemini and EODHD News API
Created by: Raz Hadas || raz-hadas
Raz Hadas

⋅a year ago⋅Free
Stay ahead of the market with this powerful, automated workflow that performs real-time sentiment analysis on stock market news. By leveraging the advanced capabilities of Google Gemini, this solution provides you with actionable insights to make informed investment decisions. This workflow is designed for investors, traders, and ...

    Google Sheets
    HTTP Request
    Code
    +2

Real-time forex sentiment analysis & alerts with Gemini AI to Discord
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose & Audience Forex Market AI Analyst is an advanced n8n workflow template designed for Forex traders, analysts, prop firms, brokers, and trading communities who need real-time, actionable market intelligence. By combining multi-source news aggregation and AI-powered sentiment analysis, this workflow delivers both quick alerts...

    Discord
    Code
    AI Agent
    +1

Automated stock technical analysis with xAI Grok & multi-channel notifications
Created by: SpaGreen Creative || spagreen
SpaGreen Creative

⋅9 months ago⋅$11
Who is this for? This workflow is designed for stock traders, financial analysts, investment enthusiasts, and anyone interested in automated stock market analysis. It's particularly useful for those who want to make data-driven trading decisions based on technical indicators without spending hours manually analyzing charts and data...

    Google Sheets
    HTTP Request
    Telegram
    +5

Daily AI Stock Briefing Right to Your Email: OpenAI + Tavily + Gmail
Created by: Automate With Marc || marconi
Automate With Marc

⋅a year ago⋅Free
This n8n workflow template uses community nodes and is only compatible with the self-hosted version of n8n. 📈 StockPulse: AI-Picked Daily News for Your Portfolio Stay ahead of the market with this automated, AI-powered stock market news briefing delivered straight to your inbox — no code required. Watch Step-by-step Video Tutor...

    Gmail
    AI Agent
    OpenAI Chat Model
    +1

Automated BTC & ETH market analysis alerts for Discord & Telegram with Gemini AI
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose & Audience This n8n workflow template is crafted for cryptocurrency traders, analysts, and enthusiasts who want to automate professional-grade market update alerts for BTCUSD and ETHUSD pairs. By integrating multiple trusted news sources with advanced AI-driven sentiment analysis, the agent delivers concise, actionable, and...

    Telegram
    Discord
    Code
    +2

Monetize Workflows with x402 Payment Protocol and 1Shot API
Created by: 1Shot API || oneshotapi
1Shot API

⋅a year ago⋅Free
Monetize Your n8n Workflow with x402 This workflow lets you monetize any n8n workflow with the x402 payment protocol. It uses 1Shot API as the onchain transaction fascilitator role. Check out the tutorial video for a complete walkthrough. Setup Create a free 1Shot API account, then go to the API Keys tab and generate a new ...

    Code

Real-Time Bitcoin Price Alerts with Bright Data & n8n
Created by: Yaron Been || yaron-nofluff
Yaron Been

⋅a year ago⋅Free
Description This workflow monitors Bitcoin prices across multiple exchanges and sends you alerts when significant price drops occur. It helps crypto traders and investors identify buying opportunities without constantly watching the markets. Overview This workflow monitors Bitcoin prices across multiple exchanges and sends you a...

    Google Sheets
    HTTP Request
    Gmail
    +2

Weekly financial markets report: Generate with Gemini AI for Telegram & Discord
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose & Overview This workflow is designed for market analysts, traders, and content creators who need a comprehensive, automated solution for generating weekly market intelligence reports. By aggregating and structuring news and forecasts across all major financial sectors, it streamlines the process of delivering actionable wee...

    Telegram
    Discord
    Code
    +3

Automate fundamental stock analysis with FinnHub data and Google Sheets DCF calculator
Created by: AiAgent || lifehacks
AiAgent

⋅9 months ago⋅$20
Quick overview Intrinsic Valuation (DCF): The workflow applies a Discounted Cash Flow (DCF) model, using the calculated TTM FCF as the base for a multi-year explicit forecast, generating a theoretical intrinsic price target for the company’s stock. How it works Data Acquisition & Structuring: The system initiates by securely extra...

    Google Sheets
    HTTP Request
    Code

Crypto Alpha Scanner with OpenAI - On-Chain and Social Alerts to Telegram
Created by: Luka Zivkovic || zivkovic58
Luka Zivkovic

⋅a year ago⋅$29
🎯 What This Does This n8n workflow is a comprehensive crypto intelligence system that monitors multiple data sources simultaneously to identify alpha opportunities, whale movements, and emerging trends before they become mainstream. It's like having a team of crypto analysts working 24/7 to spot the next big move.* Installment ...

    HTTP Request
    Telegram
    Reddit
    +2

Currency Converter via Webhook using ExchangeRate.host
Created by: ist00dent || ist00dent
ist00dent

⋅a year ago⋅Free
This n8n template allows you to perform real-time currency conversions by simply sending a webhook request. By integrating with the ExchangeRate.host API, you can get up-to-date exchange rates for over 170 world currencies, making it an incredibly useful tool for financial tracking, e-commerce, international business, and personal ...

    HTTP Request

Trading Journal: Log Trades Into Google Sheets via Telegram & Gemini AI
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$10
This smart AI-powered trading journal lets you easily log and update your trades using Telegram messages. Just send your trade details by text to your personal telegram bot, and the system will extract key information and save it in a Google Sheets journal for you. Simply send messages to your personal trade journal assistant (bot...

    Google Sheets
    Telegram
    Code
    +4

Get Colombian Peso to USD Exchange Rate with Telegram Bot and AI Date Recognition
Created by: Juan Sanchez || juansave
Juan Sanchez

⋅a year ago⋅Free
📌 Request TRM (Colombian Peso to US Dollar exchange rate) 🎯 Objective Retrieve the TRM (Colombian Peso to US Dollar exchange rate) for a specific date provided by the user via Telegram. 🔄 Summary Flow 📨 Telegram Message The user sends a text or audio message to the Telegram Bot. 🧠 Date Extraction AI (OpenAI) is...

    HTTP Request
    Telegram
    Code
    +6

AI agents can get end of day market data with this Marketstack Tool MCP Server
Created by: David Ashby || cfomodz
David Ashby

⋅a year ago⋅Free
Complete MCP server exposing all Marketstack Tool operations to AI agents. Zero configuration needed - all 3 operations pre-built. ⚡ Quick Setup Need help? Want access to more workflows and even live Q&A sessions with a top verified n8n creator.. All 100% free? Join the community Import this workflow into your n8n instance Acti...

CoinGecko crypto price forecasting pipeline with Gemini AI, Decodo, and Gmail
Created by: Fahmi Fahreza || fahmiiireza
Fahmi Fahreza

⋅a year ago⋅Free
Quick overview Sign Up for Decodo HERE for discount This template scrapes CoinGecko pages for selected coins, converts metrics into clean JSON, stores them in an n8n Data Table, generates 24-hour direction forecasts with Gemini, and emails a concise report. How it works A 30-minute schedule loops through configured coins, scrapes...

    Gmail
    Code
    AI Agent
    +2

AI Forex Trader using claude/gpt, MT5 & News Sentiment Analysis
Created by: Cj Elijah Garay || elijahbuilds-ai
Cj Elijah Garay

⋅5 months ago⋅$149
Automate Your Forex Portfolio with AI: GPT-4o or Claude + MT5 + Live News Sentiment Harness real-time news, multi-source sentiment scoring, and geopolitical risk intelligence to manage your forex portfolio smarter — all automated inside n8n. This n8n template demonstrates a fully AI-powered forex portfolio management workflow tha...

    HTTP Request
    Discord
    Code
    +2

Automated 24/7 Crypto News Alerts To X, Telegram & Discord (Gemini Powered)
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$39
Purpose & Audience This workflow delivers real-time crypto news alerts to X, Discord and Telegram, providing instant updates to help you stay ahead in the fast-moving world of cryptocurrency. Designed specifically for crypto traders, community managers, market analysts, content creators, and anyone needing reliable, up-to-the-minut...

    Telegram
    Discord
    X (Formerly Twitter)
    +2

Collect historical price data from Polymarket Up/Down markets into Supabase
Created by: Caio Carvalho || caio-carvalho
Caio Carvalho

⋅8 months ago⋅Free
This workflow automatically collects historical price data from Polymarket Up/Down markets and stores it in Supabase, creating a structured and query-ready dataset for analysis. By continuously fetching price movements from prediction markets such as Bitcoin, S&P 500, and other Up/Down series, the automation enables reliable histor...

    HTTP Request
    Supabase

Stock Fundamental Analysis & AI-Powered Reports with Mistral and AlphaVantage
Created by: Sebastian/OptiLever || lewxiangang
Sebastian/OptiLever

⋅a year ago⋅$20
Fundamental Analysis, Stock Analysis, and AI Integration in the Fundamental Analysis Tool Overview of the Tool The Fundamental Analysis Tool is an automated workflow designed to evaluate a stock’s fundamentals using financial data and AI-driven insights. Built in the n8n automation platform, it: Collects financial data for a use...

    HTTP Request
    Gmail
    Code
    +5

Track Top Meme Coin Prices with Telegram Bot and CoinGecko API
Created by: Muhammad Zeeshan Ahmad || connectedwithaiagents
Muhammad Zeeshan Ahmad

⋅a year ago⋅Free
Platform: n8n (Telegram Bot Integration) Purpose: Let users fetch top meme coin prices in real-time using a simple /memecoin Telegram command How It Works (Logic Breakdown) This flow listens for a Telegram command and fetches data from the CoinGecko API to respond with live memecoin prices. 🔹 1. Telegram Trigger Node Listens fo...

    HTTP Request
    Telegram

Get IPO Calendar Alerts via Telegram with Finnhub API and Gemini AI
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$15
Get instant notifications about new US companies going public (IPOs) sent straight to your Telegram—easy setup, no programming skills needed. Perfect for investors, traders, and anyone interested in the latest stock market opportunities. Purpose & Audience This n8n workflow is designed for investors, financial analysts, and comm...

    HTTP Request
    Telegram
    Code
    +3

Get Blockchain Insights from Chat using GPT-4 and Nansen MCP
Created by: Nansen || nansen
Nansen

⋅a year ago⋅Free
This workflow contains community nodes that are only compatible with the self-hosted version of n8n. How it works This workflow listens for an incoming chat message and routes it to an AI Agent. The agent is powered by your preferred Chat Model (such as OpenAI or Anthropic) and extended with the Nansen MCP tool, which enables it ...

    AI Agent
    OpenAI Chat Model
    MCP Client Tool

Send AI-Enhanced Economic Calendar Alerts to Telegram with Gemini-2.0-Flash
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$25
Stay ahead of the markets with this fully automated n8n workflow that delivers real-time, AI-formatted economic calendar updates directly to your Telegram channel or group. Powered by the Economic Events Calendar API via RapidAPI, this workflow is perfect for traders, investors, and financial community managers who want timely no...

    HTTP Request
    Telegram
    Code
    +3

Create a Self-Hosted Blockchain Payment Processor with x402 and 1Shot API
Created by: 1Shot API || oneshotapi
1Shot API

⋅a year ago⋅Free
This workflow contains community nodes that are only compatible with the self-hosted version of n8n. Self-Hosted x402 Facilitator In the x402 payment protocol, a facilitator is a role which helps sellers settle stablecoin payments onchain without dealing with blockchain complexities. This workflow allows you to run your own fully...

    Code

Multi-Chain Token Swap Relayer with Li.Fi
Created by: 1Shot API || oneshotapi
1Shot API

⋅a year ago⋅Free
Swap Tokens with Li.Fi The growing popularity of agentic payments has lead to the development of protocols like x402 where agents and humans can pay for internet resources over standard http protocols using stablecoins. This workflow lets you run your own swap relayer where callers can provide an x402-compatible payment header ...

    HTTP Request
    Code

Automated Stock Trading with AI: Integrating Alpaca and Google Sheets
Created by: Raz Hadas || raz-hadas
Raz Hadas

⋅a year ago⋅Free
Description Transform your investment strategy with a fully automated, AI-driven trading bot. This workflow bridges the gap between AI-powered market insights and real-world trading by executing buy and sell orders directly through the Alpaca paper trading API. Designed to work in tandem with the Automated Stock Sentiment Analys...

    Google Sheets
    HTTP Request
    Code

Cryptocurrency volume/mCap screener - automated trading alerts to Discord
Created by: Malik Hashir || malikx
Malik Hashir

⋅10 months ago⋅$45
Purpose & Audience This n8n workflow template is designed for cryptocurrency traders, investors, and market analysts who want to automate the process of detecting unusual trading activity across 1,250+ cryptocurrencies. By continuously monitoring volume-to-market-cap ratios and price movements, the workflow delivers real-time alert...

    HTTP Request
    Code

Fetch real-time stock quotes to Google Sheets with OpenAI, Octagon and GitHub
Created by: Octagon || kenoctagon
Octagon

⋅4 months ago⋅Free
Quick overview Automates real-time stock quote enrichment in Google Sheets using n8n, OpenAI, and the Octagon Agent. Reads ticker symbols from a spreadsheet, fetches a live quote Skill from GitHub, and writes structured market data back to the sheet. How it works Fetches the live SKILL.md file from GitHub using the provided skills...

    Google Sheets
    HTTP Request
    Code
    +1

Generate daily Bitcoin on-chain metrics PDF report with NASDAQ data
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$1
Purpose and Audience This n8n automation workflow is designed to generate a Bitcoin Daily On-Chain Metrics report in PDF format by fetching and transforming real-time blockchain data. It is ideal for cryptocurrency analysts, traders, investors, and blockchain enthusiasts who want to monitor Bitcoin's network activity, market valuat...

    HTTP Request
    Code

Fetch Real-Time Bitget Spot Market Data with GPT-4o + Telegram
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Instantly fetch real-time Bitget spot market data directly in Telegram! This workflow integrates the Bitget REST v2 API with Telegram (plus optional AI-powered formatting) to deliver the latest crypto price, order book, candles, and recent trades. Perfect for crypto traders, analysts, and investors who need reliable market data at ...

    Telegram
    Code
    AI Agent
    +4

Automated Forex News Alert System with Forex Factory and Telegram
Created by: Harry Gunadi Permana || harrygp
Harry Gunadi Permana

⋅a year ago⋅Free
Get Forex Factory News Release to Telegram This n8n template demonstrates how to capture Actual Data Releases as quickly as possible for trading decisions. Use cases: Get notified if the actual data release is positive or negative for the relevant currency. Use the Telegram chat message about the news release as a trigger to open ...

    Telegram
    Airtop

Send daily AI crypto market insights with Google Gemini to Telegram
Created by: Atha Ahsan Xavier Haris || athaahsan
Atha Ahsan Xavier Haris

⋅4 months ago⋅Free
Daily Crypto AI Market Insight to Telegram This workflow generates a daily AI-powered crypto market insight and sends it to Telegram using Binance public market data, the Crypto Fear & Greed Index, and Google Gemini. It fetches BTC/USDT daily OHLCV data, calculates technical indicators, builds a structured analysis payload, asks ...

    HTTP Request
    Telegram
    Code
    +2

Automated US Stock Portfolio Analysis with Telegram, Perplexity AI & PDF Reports
Created by: Solido AI || solidoai
Solido AI

⋅a year ago⋅$150
System Architecture Two integrated N8N workflows providing automated US stock portfolio management through Telegram: FLOW 1: Conversational Portfolio Manager Telegram bot for interactive portfolio management PDF upload & analysis via LlamaIndex Cloud API Natural language portfolio updates via GPT-4.1-mini Real-time user registrati...

    HTTP Request
    Postgres
    Telegram
    +9

KodoFlow - Futures & Options Trading Copilot
Created by: Blukaze Automations || hellopaul
Blukaze Automations

⋅8 months ago⋅$19
This n8n template automates futures and options market intelligence by combining multi-timeframe price behavior, options context, and real-time news sentiment to deliver clear, risk-aware AI insights for US equity markets. Instead of producing noisy trading signals, KodoFlow focuses on market behavior, institutional conviction (o...

    HTTP Request
    Telegram
    Code
    +3

🛠️ CoinGecko Tool MCP Server 💪 all 9 operations
Created by: David Ashby || cfomodz
David Ashby

⋅a year ago⋅$25
Need help? Want access to this workflow + many more paid workflows + live Q&A sessions with a top verified n8n creator? Join the community Complete MCP server exposing all CoinGecko Tool operations to AI agents. Zero configuration needed - all 9 operations pre-built. ⚡ Quick Setup Import this workflow into your n8n instance Act...

Real-Time Stock Monitor with Smart Alerts for Indian & US Markets
Created by: Oneclick AI Squad || oneclick-ai
Oneclick AI Squad

⋅a year ago⋅Free
Monitor Indian (NSE/BSE) and US stock markets with intelligent price alerts, cooldown periods, and multi-channel notifications (Email + Telegram). Automatically tracks price movements and sends alerts when stocks cross predefined upper/lower limits. Perfect for day traders, investors, and portfolio managers who need instant notifi...

    Send Email
    Google Sheets
    HTTP Request
    +2

Real-Time Crypto Price Bot for Telegram with Gemini AI & CoinGecko
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$19
Purpose Transform your Telegram into a powerful cryptocurrency price tracker! This n8n workflow creates an intelligent Telegram bot that instantly fetches and beautifully formats real-time crypto market data. Simply send any cryptocurrency ticker symbol, and get comprehensive market information in seconds. Who Is This For? Perfect...

    HTTP Request
    Telegram
    Code
    +1

Create a daily market brief from Google Sheets, Alpha Vantage, Reddit, OpenAI, and Slack
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅Free
📊 Description This workflow automatically creates a daily market intelligence brief for your stock portfolio. Instead of checking prices, news, and social media separately, it brings everything together into one clear update. On a scheduled basis, the workflow reads your stock list from Google Sheets and processes each stock indiv...

    Google Sheets
    HTTP Request
    Slack
    +2

Crypto volume change Discord alerts (5-20%) with CoinGecko (Top 1000 coins)
Created by: Malik Hashir || malikx
Malik Hashir

⋅9 months ago⋅$45
Purpose and Audience This professional-grade n8n workflow automation is designed for crypto traders, investors, and market analysts who need real-time volume change alerts across different market cap segments. Whether you're day trading, swing trading, or conducting market research, this workflow keeps you informed of significant v...

    HTTP Request
    Code

Crypto Exchange Listing & Delisting Alerts to Telegram, X, and Discord
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$41
Purpose and Audience This n8n workflow template is designed to provide real-time alerts on new cryptocurrency exchange listings and delistings. It caters especially to crypto traders, investors, and enthusiasts who want to stay ahead of market changes by receiving timely notifications about token availability across major exchanges...

    HTTP Request
    Telegram
    Discord
    +3

Track Crypto Prices, New Listings & Transactions with CoinGecko & Google Sheets
Created by: Marth - Business Automation || marth
Marth - Business Automation

⋅a year ago⋅$4
⚙️ How It Works This workflow is a comprehensive crypto automation system that combines three critical functions for traders and investors into one powerful tool: 📊 Price Monitor A Cron trigger runs on a schedule (e.g., every minute). A HTTP Request node checks the cryptocurrency's price. An If node compares the price against a ...

    Google Sheets
    HTTP Request
    Telegram
    +1

Automated Range Trading with Uniswap V3, Telegram Alerts & MetaMask Delegation
Created by: 1Shot API || oneshotapi
1Shot API

⋅a year ago⋅Free
Simple Range Trading w/ Uniswap V3 This workflow will monitor the price of a token trading pair (default is ETH - USDC) and automatically buy into ETH or sell into USDC based on a price window configured by the user. Additionally, the workflow will notify the user on Telegram before a trade is executed, giving the user 1 minute...

    Telegram
    Code

Extract and Analyze Truth Social Posts for Stock Market Impact with Airtop & Slack
Created by: Airtop || cesar-at-airtop
Airtop

⋅a year ago⋅Free
Trump-o-meter: Extract and Evaluate Truth Social Posts Use Case Automatically extracting posts from Donald Trump's Truth Social account and estimating their potential impact on the U.S. stock market enables teams to monitor high-profile communications that may influence financial markets. This automation streamlines intelligence ...

    Slack
    Airtop

Track weekly portfolio risk using GPT-4.1, Slack alerts, and Google Sheets
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅Free
📊 Description This workflow reads your portfolio from Google Sheets, fetches market data, evaluates key risk factors such as sector concentration, volatility, and stock correlation, and generates an easy-to-understand risk summary using AI. When meaningful risk is detected, the workflow sends a structured alert to Slack and stores...

    Google Sheets
    HTTP Request
    Slack
    +3

Get AI crypto price analysis via Telegram using GPT-4o-mini and TwelveData
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅$50
📊 Description Automate real-time cryptocurrency analysis by turning Telegram messages into professional, AI-generated market reports. 📈🤖 This workflow listens to user queries in Telegram, classifies intent using AI, fetches recent OHLC price data, and generates clear, structured crypto insights covering short-term and weekly tre...

    HTTP Request
    Telegram
    Gmail
    +3

Analyze meeting sentiment with Azure OpenAI and save insights to Google Sheets
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅Free
📊 Description This workflow analyzes meeting transcripts using AI to understand team sentiment, engagement, and morale. The results are saved in Google Sheets for easy tracking and review. It receives meeting data through a webhook, validates the input, sends the transcript to AI for analysis, cleans the output, and stores the ins...

    HTTP Request
    Slack
    Telegram
    +4

Track portfolio performance and risk using Google Sheets and Alpha Vantage
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅Free
📄 Description This workflow helps users track and understand the performance of their stock portfolio in an automated and structured way. It reads portfolio holdings from Google Sheets, fetches the latest market prices, calculates key performance metrics, and updates the results back into the same sheet. In addition to standard re...

    Google Sheets
    HTTP Request
    Gmail
    +1

Fetch Live ETF Metrics from JustETF to Excel with One-Click Updates
Created by: Louis || louisdl
Louis

⋅2 years ago⋅Free
Automate Your ETF Comparison: Real-Time Data & Analysis Automate ETF research in Excel with one click. This n8n workflow pulls live data from justetf.com using ISIN codes from your Excel table, extracts key metrics (dividends, fees, 5-year performance), and updates your “Div study” sheet instantly — all triggered by a button in ...

    HTTP Request
    Microsoft Excel 365
    Code
    +1

Automated Economic Calendar PDF Reports to Telegram via RapidAPI
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$35
Stay ahead of the markets with this fully automated n8n workflow that delivers AI-generated economic calendar events PDF updates directly to your Telegram or Discord. Powered by the Economic Events Calendar API via RapidAPI, this workflow is perfect for traders, investors, and financial community managers who want timely notificat...

    HTTP Request
    Telegram
    Code

Track Forex Factory News Releases with MyFxBook, Telegram & Google Sheets
Created by: Harry Gunadi Permana || harrygp
Harry Gunadi Permana

⋅a year ago⋅Free
Get Forex Factory News Release to Telegram, Google Sheets. Record News Data and Live Price from MyFxBook for Affected Currency Pairs. This n8n template demonstrates how to capture Actual Data Releases as quickly as possible for trading decisions. Use cases: Get notified if the actual data release is positive or negative for the re...

    Google Sheets
    HTTP Request
    Telegram
    +1

FinnHub API and Slack Template
Created by: Fan Luo || luofan189
Fan Luo

⋅a year ago⋅Free
Daily Company News Bot This n8n template demonstrates how to use Free FinnHub API to retrieve the company news from a list stock tickers and post messages in Slack channel with a pre-scheduled time. How it works We firstly define the list of stock tickers you are interested Loop over items to call FinnHub API to get the latest com...

    HTTP Request
    Slack
    Code

Send Daily Currency Exchange Rate Updates via CurrencyFreaks API and Gmail
Created by: Sarfaraz Muhammad Sajib || sarfarazmuhammad
Sarfaraz Muhammad Sajib

⋅a year ago⋅Free
Daily Currency Update Workflow (n8n) Trigger: ScheduleTrigger node (configurable interval) Set Variables: API Key, Preferred Currencies (PKR, GBP, EUR, USD, BDT, INR) HTTP Request: Fetch latest exchange rates from CurrencyFreaks API Set Recipient Email Set Email Subject Send Email: HTML formatted via Gmail OAuth2 with dynamic rate...

    HTTP Request
    Gmail

Track Crypto Market Gainers & Losers with CoinGecko and Discord Bot
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$47
Purpose Automate cryptocurrency market monitoring by tracking top 24-hour gainers and losers from 1750+ coins, delivering professional Discord (optional Telegram, Slack etc) updates with rich embeds and real-time data. How It Works This intelligent workflow fetches comprehensive cryptocurrency data from CoinGecko's API across mult...

    HTTP Request
    Discord
    Code

Detect Binance USDT volume spikes with GPT-4o, Telegram, and Google Sheets
Created by: Đại Khiêm Như || dainv
Đại Khiêm Như

⋅3 months ago⋅Free
Quick Overview This workflow runs hourly to scan Binance USDT trading pairs for unusual 1-hour volume spikes, enriches spikes with order book metrics and GPT-4o analysis, then sends a ranked Telegram alert and logs the top results to Google Sheets. How it works Runs every hour and pulls 24-hour ticker statistics from the Binance p...

    Google Sheets
    HTTP Request
    Telegram
    +2

Forex & Gold Trading Signal Handler for MT5 using Webhooks (telegram/discord)
Created by: Cj Elijah Garay || elijahbuilds-ai
Cj Elijah Garay

⋅9 months ago⋅$120
MT5 Trading Signal Handler Metatrader5 and N8N Integration for Forex and Gold Trading via Webhooks for discord and telegram This n8n template demonstrates a workflow that bridges AI workflows which can be used to communicate directly to a trading platform/broker like metatrader 5 Use cases are many: Try automating TradingView al...

    Code

Generate AI trading alerts from CoinGecko and Alpha Vantage via Slack, email and SMS
Created by: Oneclick AI Squad || oneclick-ai
Oneclick AI Squad

⋅7 months ago⋅Free
Automates real-time market monitoring, technical analysis, AI-powered signal generation for cryptocurrencies (and stocks), filters high-confidence trades, and delivers actionable alerts via multiple channels. Good to Know Runs every 5–30 minutes (configurable trigger) to catch fresh market opportunities Pulls real-time price data ...

    Send Email
    HTTP Request
    Postgres
    +1

Summarize stock market signals with Alpaca, xAI Grok, Telegram and WhatsApp
Created by: SpaGreen Creative || spagreen
SpaGreen Creative

⋅6 months ago⋅$6
Who Is This For? This workflow is designed for stock traders, financial analysts, and investment enthusiasts who want automated technical analysis and regular market updates. It's particularly useful for those who rely on technical indicators like RSI and MACD for their trading decisions and want to receive timely notifications thr...

    HTTP Request
    Telegram
    Code
    +2

Analyze Binance Futures markets with TA indicators, OpenAI news checks, and Telegram alerts
Created by: Vadim Mubi || mubivadim
Vadim Mubi

⋅8 months ago⋅Free
This workflow acts as an automated market analyst for educational purposes. It scans Binance Futures (Testnet) for high-volume pairs, applies custom technical analysis (RSI, Bollinger Bands, EMA, ATR) using JavaScript, and uses AI to validate trends against recent news sentiment. It is designed for paper trading to demonstrate how...

    HTTP Request
    Telegram
    Crypto
    +3

Fetch live commodity quotes with Octagon, OpenAI (GPT-5.4 Mini) and Google Sheets
Created by: Octagon || kenoctagon
Octagon

⋅4 months ago⋅Free
Quick overview Automatically fetches live commodity quotes (gold, silver, crude oil, natural gas, and more) using an Octagon AI Agent, then writes prices, changes, ranges, volume, and moving averages back to a Google Sheet. How it works Reads commodity symbols (GCUSD, SIUSD, CLUSD, NGUSD, etc.) from a Google Sheet. Fetches the liv...

    Google Sheets
    HTTP Request
    Code
    +1

Automate Token Purchases with Dollar Cost Averaging on Uniswap V3 & 1Shot API
Created by: 1Shot API || oneshotapi
1Shot API

⋅a year ago⋅Free
This workflow contains community nodes that are only compatible with the self-hosted version of n8n. Dollar Cost Averaging with Uniswap V3 This workflow lets you set up an scheduled workflow to dollar cost average (DCA) into any token on a custom schedule using 1Shot API and the Uniswap V3 protocol. Choose your schedule input tok...

    Telegram
    Code

Send monthly gold SIP performance insights with Google Sheets, Groq, Slack and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅a month ago⋅Free
Quick overview This workflow runs monthly to fetch the latest gold price, calculate your gold SIP portfolio performance from Google Sheets history, generate advisory insights with Groq, and send a decision-based report to Slack and Gmail. How it works Runs on a monthly schedule trigger. Fetches the latest INR/XAU gold rate from Me...

    Google Sheets
    HTTP Request
    Slack
    +4

Log US Congress stock trades for your watchlist with Apify and Google Sheets
Created by: JohnVC || johnvc
JohnVC

⋅a month ago⋅Free
Quick overview No Firecrawl API key and no OpenAI key. This template checks every week whether any member of Congress disclosed a trade in the stocks you follow, and appends one row per transaction to Google Sheets: member, chamber, ticker, buy or sell, dollar range, and a link to the filing. How it works Runs every Monday at 08:0...

    Google Sheets

Weekly Stock/ETF Analysis with Claude & Gmail — Monthly Index Fund Review
Created by: Joe Marotta || jmarotta
Joe Marotta

⋅10 months ago⋅Free
What This Flow Does Automated stock portfolio analysis system that performs comprehensive fundamental and technical analysis of your portfolio holdings on a scheduled basis, with intelligent follow-up capabilities. How It Works Two-Phase Analysis System: Monday Analysis (Main weekly analysis) Reads your stock hol...

    Google Sheets
    HTTP Request
    Gmail
    +1

Send AI stock watchlist alerts with Google Sheets, Groq, and Slack
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅2 months ago⋅Free
Quick overview This workflow runs on a schedule, reads a stock watchlist from Google Sheets, fetches current NSE prices via an HTTP API and updates the sheet. When a stock’s move exceeds your threshold, it pulls related Google News RSS headlines, uses Groq to generate an AI explanation and posts Slack alert. How it works Runs on a...

    Google Sheets
    HTTP Request
    Slack
    +3

Automate client onboarding with Asana, Google Docs, Gmail, Slack and Sheets
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅Free
📊 Description Automate short-term trading research by generating high-quality trade ideas using MCP (Market Context Protocol) signals and AI-powered analysis. 📈🤖 This workflow evaluates market context, catalysts, momentum, and risk factors to produce structured trade ideas with clear reasoning, confidence scores, and execution n...

    Asana
    Google Sheets
    HTTP Request
    +4

Generate a daily multi-asset market report with TwelveData, Groq and Google Sheets
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅5 months ago⋅Free
Multi-Asset Daily Market Snapshot This workflow fully automates the creation of a daily multi-asset market report. It retrieves live pricing data for specified indices, forex pairs and commodities using the TwelveData API, manages rate limits safely and feeds the normalized data into a Groq-powered AI (Llama-3). The AI generates a...

    Google Sheets
    HTTP Request
    Gmail
    +3

Analyze crypto market sentiment and send Discord alerts with Gemini Gemini 2.5
Created by: M Ayoub || mayoub
M Ayoub

⋅8 months ago⋅Free
Who is this for? Crypto traders, investors, and enthusiasts who want automated daily market analysis delivered to Discord without manually checking multiple data sources. What it does Fetches real-time cryptocurrency data from 6 free APIs, analyzes market sentiment and indicators using Google Gemini AI, and sends beautifully for...

    HTTP Request
    Code
    Google Gemini

Telegram Trading Bot Assistant | LLM Powered Trading Bot For Crypto/Forex
Created by: Malik Hashir || malikx
Malik Hashir

⋅10 months ago⋅$39
Purpose & Audience This n8n workflow telegram bot is designed for crypto, forex and stock traders, quantitative analysts, and AI enthusiasts who want to explore how different Large Language Models (LLMs) perform in real-world trading scenarios. Inspired by nof1.ai's Alpha Arena, where AI models compete with real capital to prove th...

    Telegram
    AI Agent
    Google Gemini Chat Model
    +1

Track crypto price crashes with CoinGecko, Marketaux, Google Gemini and Slack
Created by: iamvaar || iamvaar
iamvaar

⋅a month ago⋅Free
Quick Overview This workflow runs every 4 hours to monitor a crypto asset’s price with CoinGecko, checks for crash conditions, pulls related headlines from Marketaux, uses Google Gemini to generate a structured market assessment, and posts a formatted crash alert to a Slack channel. How it works Runs every 4 hours on a schedule. F...

    HTTP Request
    Slack
    Code
    +3

Send financial market email alerts with Tradient, GPT-4o mini, and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅a month ago⋅Free
Quick overview This workflow runs daily during Indian market hours, pulls the latest stock-market news from the Tradient API, uses OpenAI to classify event severity and relevance, and emails concise investor alerts via Gmail for high-impact events. How it works Runs every day on a schedule and starts only if the current time is wi...

    HTTP Request
    Gmail
    Code
    +1

Send gold and WTI price alerts to Telegram using the SiftingIO API
Created by: SiftingIO || siftingio
SiftingIO

⋅a month ago⋅Free
Quick overview This workflow runs every 15 minutes, pulls Gold (XAUUSD) and WTI crude oil (WTIUSD) prices from the SiftingIO API, checks them against configurable thresholds (or a test mode), and sends price alert messages to a Telegram chat. How it works Runs every 15 minutes on a schedule. Requests the latest XAUUSD (gold) and W...

    HTTP Request
    Telegram
    Code

Generate multi-quarter earnings reports with Google Workspace, Gemini and Pinecone
Created by: Redowan Ahmed Farhan || redowanfarhan
Redowan Ahmed Farhan

⋅a month ago⋅Free
Quick overview This workflow ingests quarterly earnings PDFs listed in Google Sheets from Google Drive into a Pinecone vector index using Google Gemini embeddings, then uses an OpenAI-powered agent with Pinecone retrieval to generate a markdown earnings-trend report and save it into Google Docs. How it works Starts when you manual...

    Google Sheets
    Google Drive
    Google Docs
    +8

Track and alert congressional and insider trades via EDGAR, House.gov, and Gmail
Created by: Zain Khan || zain
Zain Khan

⋅a month ago⋅Free
Quick overview This workflow runs every 45 minutes to monitor U.S. House periodic transaction reports from House.gov and insider Form 4 filings from the SEC EDGAR Atom feed, enriches each filing with trade details from PDFs/XML, deduplicates against a Google Sheets log, and sends email alerts via Gmail. How it works Runs every 45 ...

    Google Sheets
    Gmail
    Compression
    +1

Send AI market briefings to email and Discord with AlphaAI and GPT-4
Created by: AlphaAI || alphai-io
AlphaAI

⋅2 months ago⋅Free
Quick Overview This workflow runs every 15 minutes to fetch AlphaAI’s trending market news, filter for new high-relevance, ticker-linked stories, and post them to a Discord channel via webhook as rich embed cards with sentiment and impact details. How it works Runs every 15 minutes on a schedule trigger. Requests the current trend...

    Send Email
    HTTP Request
    Code
    +2

Generate dividend income reports via Telegram with Google Gemini
Created by: Blukaze Automations || hellopaul
Blukaze Automations

⋅3 months ago⋅$19
Quick overview This workflow listens for Telegram messages, validates the sender, parses an investment amount and risk strategy, builds a predefined dividend ETF/stock allocation, calculates estimated yield and income, and uses Google Gemini to format a concise portfolio report that it sends back in Telegram. How it works Triggers...

    Telegram
    Code
    AI Agent
    +1

Deploy Gainium DCA bot pairs with Telegram approval and Google Sheets logging
Created by: Gainium || aressanch
Gainium

⋅2 months ago⋅Free
Quick overview This workflow runs daily, pulls top coins from the Gainium crypto screener, formats them into USDT trading pairs, and asks for Telegram approval before updating and starting a Gainium DCA bot, with optional deployment logging to Google Sheets and Telegram error alerts. How it works Runs every day at 08:00 on a sched...

    Google Sheets
    Telegram
    Code

Send portfolio risk reports with Google Sheets, GPT-4o-mini and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅3 months ago⋅Free
Quick Overview This workflow receives a portfolio via webhook (uploaded CSV or Google Sheets), calculates allocation and concentration risk metrics, generates an OpenAI HTML risk report, emails it through Gmail, and returns a JSON API response with the report status. How it works Receives a POST webhook request containing a portfo...

    Google Sheets
    Gmail
    Code
    +1

Send crypto price alerts, daily digests and /price replies with CoinGecko, Telegram and Sheets
Created by: Cybernative Technologies || cybernative
Cybernative Technologies

⋅3 months ago⋅Free
Quick overview This workflow tracks a configurable crypto watchlist using the CoinGecko API, sends Telegram alerts when price, % change, or volume-spike conditions are met (with optional RSI filtering), optionally logs triggered alerts to Google Sheets, and also provides a daily Telegram digest plus a /price command bot. How it wo...

    Google Sheets
    HTTP Request
    Telegram
    +1

Compare gold and equity performance with Google Sheets, Groq, QuickChart and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅5 months ago⋅Free
Gold vs Equity Performance Comparison Tracker with Visual Insights This automated n8n workflow evaluates the historical performance of gold against equity markets. It extracts daily price data from Google Sheets, calculates comparative returns and uses an AI agent to generate actionable investment insights. Finally, it creates a v...

    Google Sheets
    Gmail
    Code
    +2

Execute forex trading signals from Telegram on MetaTrader 5 with Claude
Created by: Cj Elijah Garay || elijahbuilds-ai
Cj Elijah Garay

⋅6 months ago⋅$99
Telegram Signal Receiver and Processor This n8n template is the missing link between your Telegram trading signal channels and MetaTrader 5. It listens to your Telegram bot, uses AI to detect and parse trading signals in real time, then forwards them directly to your MT5 instance via the signal handler webhook — no manual copying ...

    HTTP Request
    Code
    Basic LLM Chain
    +2

Analyze stocks in Telegram with Twelve Data, GPT-4o and o3-mini
Created by: Femi Ad || hgray
Femi Ad

⋅6 months ago⋅$20
TwelveData Pro Analyst — AI-Powered Stock Analysis Bot for Telegram Turn your Telegram into a personal Bloomberg terminal. Ask any question about any stock — get institutional-grade analysis back in seconds. What Is This? TwelveData Pro Analyst is a complete, ready-to-import n8n workflow that connects a Telegram bot to live fina...

    Telegram
    Code
    AI Agent
    +4

Daily Crypto Yield Monitor: Track Top Binance Earn APY Rates with Earnings Calculator
Created by: GYEONGJUN CHAE || jun
GYEONGJUN CHAE

⋅9 months ago⋅Free
Get top Binance Earn yields sent to Email This workflow automates the tracking of passive income opportunities on Binance by fetching real-time Flexible Earn APY rates, calculating potential returns, and delivering a daily summary to your inbox. Manually checking crypto savings rates is tedious. This template handles the complex ...

    HTTP Request
    Crypto
    Gmail
    +1

Discord AI Trading Assistant with Proper Position Sizing (metatrader5)
Created by: Cj Elijah Garay || elijahbuilds-ai
Cj Elijah Garay

⋅9 months ago⋅$120
AI Trading Assistant with Metatrader5 and position sizing capabilities Trade or buy/sell forex and xauusd/gold assets with this n8n template. It demonstrates an AI-powered Discord bot that monitors trading commands in a private server channel and automatically executes them on MetaTrader 5, using natural language processing to pa...

    HTTP Request
    Discord
    Code
    +2

Monetize your X Following with x402 and 1Shot API
Created by: 1Shot API || oneshotapi
1Shot API

⋅10 months ago⋅Free
Get Paid in Stablecoins for Reposting from your X Account The x402 payment standard is growing in popularity and has enabled new monetization opportunities for internet resources. This workflow lets you automate the monetization of your followers on X by receiving payment in the form of stablecoins in return for reposting content...

    Telegram
    X (Formerly Twitter)
    Code

Aggregate Crypto and Stock Market News Feed from Multiple Sources
Created by: Mohammad Abubakar || m7abr
Mohammad Abubakar

⋅10 months ago⋅Free
This n8n template helps in making informed decisions for Crypto and Stocks Trading by helping you keep track of breaking changes in the market. How it works Collects crypto and/or stock market headlines from multiple sources: CoinDesk, CoinTelegraph, Google News, and X (via an RSS proxy). Normalizes all items into a consistent st...

    HTTP Request
    Code

Gold Market Prediction System with Perplexity Sonar-Pro, FRED Data, and WordPress Reporting
Created by: Cheng Siong Chin || cschin
Cheng Siong Chin

⋅10 months ago⋅Free
Introduction Automates gold market tracking using AI forecasting by collecting live prices, financial news, and macro indicators (inflation, interest rates, employment) to produce real-time insights and trend predictions for analysts and investors. How It Works Every 6 hours, the system fetches market data and news → runs AI senti...

    Send Email
    HTTP Request
    Slack
    +3

Stock Market Analysis & Prediction with GPT, Claude & Gemini via Telegram
Created by: Cheng Siong Chin || cschin
Cheng Siong Chin

⋅10 months ago⋅Free
Introduction Automates stock market analysis using multiple AI models to predict trends, analyze sentiment, and generate consensus-based investment insights. For traders and analysts seeking data-driven forecasts by eliminating manual research and combining AI perspectives for accurate predictions. How It Works Daily trigger fetch...

    HTTP Request
    Telegram
    Code
    +4

Reddit Crypto Market Intelligence with CoinGecko Alerts to Discord
Created by: AFK Crypto || afkcrypto
AFK Crypto

⋅10 months ago⋅Free
Try It Out! 🚀 Reddit Crypto Intelligence & Market Spike Detector ⸻ 🧠 Workflow Description Reddit Crypto Intelligence & Market Spike Detector is an automated market sentiment and price-monitoring workflow that connects social chatter with real-time crypto price analytics. It continuously scans new posts from r/CryptoCurrency, ...

    HTTP Request
    Discord
    Code

Track analyst target and rating drift with Yahoo Finance MCP, OpenAI, and Telegram
Created by: Daniel Shashko || tomax
Daniel Shashko

⋅7 days ago⋅Free
Quick overview This workflow runs every weekday morning, pulls analyst price targets and consensus ratings for a stock watchlist via a self-hosted Yahoo Finance MCP server, stores daily snapshots in an n8n Data Table, and sends a Telegram digest only when targets or ratings drift beyond your threshold. How it works Runs every week...

    HTTP Request
    Telegram
    Code
    +2

Track game prices and deals from Discord using IsThereAnyDeal
Created by: Akz || akz
Akz

⋅11 days ago⋅Free
Quick overview This workflow connects Discord with the IsThereAnyDeal (ITAD) API, enabling users to manage a game watchlist via Discord commands, get real-time deal and price updates, and receive automated price-drop alerts within Discord channels. How it works Receives command messages through a Discord webhook. Parses the comman...

    HTTP Request
    Discord
    Code

Send daily XAUUSD macro signals with TwelveData, GDELT, Groq, OpenAI and Telegram
Created by: Louis Noël || onyxiabynoel
Louis Noël

⋅13 days ago⋅Free
Quick overview This workflow runs daily to fetch XAU/USD price, DXY, and US 10Y yield data, pulls related US financial news from GDELT and RSS feeds, uses Groq-hosted LLM analysis to generate a BUY/SELL/WAIT bias with probabilities, and sends the brief to Telegram. How it works Runs every day at 12:00 via a cron schedule. Fetches ...

    HTTP Request
    Telegram
    Code
    +2

Track Amazon price drops from Google Sheets with Apify and Telegram
Created by: Apify || apify
Apify

⋅12 days ago⋅Free
Quick overview This workflow checks Amazon product prices listed in Google Sheets using the Apify Amazon Product Scraper and sends Telegram alerts when a price drops to or below your target, while updating the sheet with the latest price and check timestamp. How it works Runs on a scheduled trigger at the interval you set. Reads a...

    Google Sheets
    Telegram

Send daily AI crypto morning brief with CoinGecko, Google Gemini and Telegram
Created by: iamvaar || iamvaar
iamvaar

⋅13 days ago⋅Free
Quick overview This workflow runs daily at 8AM to pull crypto market data from CoinGecko and the Fear & Greed Index, generates a short AI-written morning brief with Google Gemini, logs key metrics to Google Sheets, and sends a Telegram brief plus optional volatility alerts. How it works Runs every day at 8AM on a schedule. Fetches...

    Google Sheets
    HTTP Request
    Telegram
    +2

Trade forex using multi-strategy OANDA orders with Telegram alerts
Created by: Quartey Ansah || neweracy
Quartey Ansah

⋅14 days ago⋅Free
Quick overview This workflow runs every 5 minutes during active forex market hours, pulls recent candle data from OANDA for three technical strategies, and when a BUY/SELL signal appears it sizes the trade from account balance and risk settings, places a market order on OANDA, and sends a Telegram alert. How it works Runs every 5 ...

    HTTP Request
    Telegram
    Code

Summarize market data and finance news with Google Gemini and Discord
Created by: Akz || akz
Akz

⋅16 days ago⋅Free
Quick Overview This workflow posts scheduled market and finance-news summaries to Discord using RSS sources, Yahoo Finance, FX and gold price APIs, and Google Gemini, while also exposing a webhook command interface for on-demand market, stock, gold, USD/INR, and recent-news lookups backed by n8n Data Tables. How it works Runs ever...

    HTTP Request
    Discord
    Code
    +1

Track daily stock sentiment from Twitter and Yahoo Finance to Google Drive with Apify
Created by: Apify || apify
Apify

⋅21 days ago⋅Free
Quick overview This workflow runs daily and uses Apify to scrape stock-related tweets and fetch Yahoo Finance ticker data, then packages each dataset as a date-stamped JSON file and uploads both files to a chosen Google Drive folder. How it works Runs every day at 9:00 AM on a schedule. Uses Apify’s Twitter (X.com) Scraper Unlimit...

    Google Drive

Post FX rate change commentary to Slack with Frankfurter and Claude
Created by: 鈴木光輝（Koki Suzuki）：JP || koki-suzuki
鈴木光輝（Koki Suzuki）：JP

⋅25 days ago⋅Free
Quick overview On a schedule, this workflow checks an exchange rate via the free Frankfurter API, compares it to the last checked rate, and — if it moved beyond a threshold you set — asks Claude to write a short factual note and posts it to Slack. How it works On a schedule, fetches the current rate for a currency pair you configu...

    HTTP Request
    Code

Track flight prices with Apify Google Flights, Google Sheets, and Telegram
Created by: iamvaar || iamvaar
iamvaar

⋅a month ago⋅Free
Quick Overview This workflow runs daily to search flight prices via the Apify Google Flights actor, logs each check to Google Sheets, and sends a Telegram alert when the lowest price drops below your threshold and is meaningfully lower than the last notified price. How it works Runs every day at 7am and loads the flight search inp...

    Google Sheets
    HTTP Request
    Telegram
    +1

Send NSE stock watchlist alerts with Google Sheets and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅a month ago⋅Free
Quick overview This workflow polls a Google Sheets stock watchlist every five minutes during weekday market hours, fetches live quotes from an NSE quotes HTTP API, and sends Gmail alerts when prices cross buy-below or sell-above thresholds while logging each triggered alert back to Google Sheets. How it works Runs every 5 minutes ...

    Google Sheets
    HTTP Request
    Gmail
    +1

Monitor Binance futures open interest and send Telegram alerts
Created by: Đại Khiêm Như || dainv
Đại Khiêm Như

⋅2 months ago⋅Free
Quick Overview This workflow runs hourly to scan top-volume Binance USDT perpetual futures, calculate 1-hour open interest (OI) change percentages, and send a tiered Telegram alert (warning/critical) when OI moves exceed configured thresholds. How it works Runs every hour on a schedule trigger. Calls the Binance Futures /fapi/v1/t...

    HTTP Request
    Telegram
    Code

Switch Gainium DCA bot risk mode with the fear and greed index and Telegram
Created by: Gainium || aressanch
Gainium

⋅2 months ago⋅Free
Quick overview This workflow runs daily, fetches the Crypto Fear & Greed Index from alternative.me, and uses it to start or stop a Gainium Crypto Trading DCA bot as a simple risk-on/risk-off switch, sending the current regime and any errors to Telegram. How it works Runs every day at 08:00 on a schedule. Loads your bot settings, F...

    HTTP Request
    Telegram
    Code

Monitor crypto news risk with CoinDesk RSS, OpenAI, Gmail, and Google Sheets
Created by: isaWOW || isawow
isaWOW

⋅2 months ago⋅Free
Quick overview This workflow polls the CoinDesk RSS feed every 10 minutes, filters for crypto-related stories, checks Google Sheets to avoid duplicates, uses OpenAI to score and summarize risk, logs results to Google Sheets, and sends Gmail alerts when the risk priority is HIGH or MEDIUM. How it works Polls the CoinDesk RSS feed e...

    Google Sheets
    HTTP Request
    Gmail
    +1

Send gold-silver ratio opportunity alerts with GoldAPI and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅2 months ago⋅Free
Quick overview This workflow fetches live gold (XAU) and silver (XAG) prices from GoldAPI.io, calculates the gold-silver ratio, evaluates it against buy/hold thresholds, and sends a formatted opportunity alert email via Gmail. How it works Starts manually and loads configuration values such as the GoldAPI.io key, currency, alert e...

    HTTP Request
    Gmail
    Code

Track SIP goals with OpenAI ChatGPT, Gmail and Google Sheets
Created by: Incrementors || incrementors
Incrementors

⋅2 months ago⋅Free
Quick Overview This workflow collects SIP and mutual fund details via an n8n Form, calculates goal and performance metrics, generates a personalized advisory using OpenAI, emails a color-coded HTML report via Gmail, and appends each submission to a Google Sheets log for ongoing tracking. How it works Receives an investor submissio...

    Google Sheets
    HTTP Request
    Gmail
    +1

Send prioritized forex risk alerts from ForexLive RSS with OpenAI and Slack
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅2 months ago⋅Free
Quick Overview This workflow polls the ForexLive RSS feed every five minutes, filters for forex-relevant headlines, uses OpenAI to generate structured risk analysis, deduplicates items in an n8n Data Table, and sends high-priority alerts to a Slack channel. How it works Polls the ForexLive RSS feed on a */5 * * * * schedule and in...

    Slack
    Code
    OpenAI

Capture and log email trade instructions with Gmail, OpenAI, and Google Sheets
Created by: Incrementors || incrementors
Incrementors

⋅2 months ago⋅Free
Quick overview This workflow polls Gmail for emails with the subject “Trade Instruction”, uses OpenAI Chat Completions to extract trade fields from the email body, logs valid and failed extractions to separate tabs in Google Sheets, and sends confirmation and ops alert emails via Gmail. How it works Triggers every minute by pollin...

    Google Sheets
    HTTP Request
    Gmail
    +1

Send portfolio risk reports from Google Sheets with OpenAI and Gmail
Created by: Incrementors || incrementors
Incrementors

⋅3 months ago⋅Free
Quick overview This workflow collects a portfolio request via an n8n Form, loads holdings from Google Sheets, calculates portfolio risk and concentration metrics, generates an HTML risk narrative with OpenAI, then emails the full report via Gmail and appends an audit record back to Google Sheets. How it works Receives a portfolio ...

    Google Sheets
    Gmail
    Code
    +2

Analyze commodity portfolio diversification with Sheets, Gemini, and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅3 months ago⋅Free
Quick Overview This workflow reads a gold/silver/oil portfolio from Google Sheets, pulls current commodity prices and a recent gold trend from GoldAPI, EIA, and Twelve Data, calculates allocation and HHI concentration risk, generates a Gemini analysis, and emails an HTML diversification report via Gmail. How it works Starts manual...

    Google Sheets
    HTTP Request
    Gmail
    +2

Log gold and silver prices and email Groq insights with Google Sheets
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅3 months ago⋅Free
Quick Overview This workflow manually logs daily Gold and Silver prices from GoldAPI into Google Sheets, summarizes historical monthly averages, generates seasonal insights with Groq (LLM), builds QuickChart bar charts, and emails a formatted report via Gmail. How it works Starts manually and loads a two-item asset list (Gold/XAU ...

    Google Sheets
    HTTP Request
    Gmail
    +3

Monitor Binance futures funding rates and alert Telegram hourly
Created by: Đại Khiêm Như || dainv
Đại Khiêm Như

⋅3 months ago⋅Free
Quick Overview This workflow runs hourly to scan Binance Futures USDT perpetual contracts, checks each symbol’s funding rate against warning and critical thresholds, and sends a formatted alert message to Telegram when any high funding rates are detected. How it works Runs every hour on a schedule. Fetches all 24-hour ticker stats...

    HTTP Request
    Telegram
    Code

Simulate investment scenarios with Groq and live Google News RSS feeds
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅3 months ago⋅Free
Quick Overview This workflow receives investment inputs via a webhook, calculates projected returns and a risk profile, pulls matching Google News RSS headlines for market context, and uses Groq (LangChain agent) to generate a structured JSON analysis with three investment suggestions returned in the webhook response. How it works...

    Code
    AI Agent
    Groq Chat Model

Track investor behavior with NewsAPI, Gemini, Groq and Slack alerts
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅3 months ago⋅Free
Quick Overview This workflow captures an investor’s buy/sell action via an n8n Form, pulls related market news from NewsAPI, uses Google Gemini to generate a one-line behavioral reflection, sends it via Gmail and Slack, stores it in an n8n Data Table, and posts a weekly Slack summary using Groq. How it works Receives an investment...

    HTTP Request
    Code
    AI Agent
    +2

Send commodity investment briefings from CNBC RSS with Gemini and Slack
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅3 months ago⋅Free
Quick Overview This workflow pulls commodity-related headlines from the CNBC RSS feed, filters and ranks the most relevant items, uses Google Gemini to generate an actionable commodity investment briefing, and posts the briefing to a Slack channel with error notifications if the RSS fetch or AI step fails. How it works Runs manual...

    Slack
    Code
    Google Gemini

Send weekly Taiwan foreign flow reports to Telegram using TWSE T86
Created by: floviq || floviq
floviq

⋅3 months ago⋅Free
Quick overview This workflow runs every Monday morning and pulls last week’s TWSE T86 institutional trading data, aggregates foreign investor net flows into weekly leaders and streaks, and sends a plain-text report to a Telegram chat. How it works Runs every Monday at 08:00 Asia/Taipei on a schedule. Loads configuration values suc...

    HTTP Request
    Telegram
    Code

Expose CoinGecko crypto data tools via an MCP server trigger
Created by: Ibrahim Edhem Harbutu || ibrh96
Ibrahim Edhem Harbutu

⋅3 months ago⋅Free
Quick overview This workflow exposes CoinGecko data retrieval as an MCP server in n8n, letting an MCP client call multiple CoinGecko tools to fetch coin details, prices, tickers, market charts, candlesticks, history, and events via a single webhook-based trigger. How it works Receives an MCP request via the CoinGecko Tool MCP Ser...

Send Murban crude futures price alerts with HTTP request and Telegram
Created by: Rahul Shah || rahulshah111
Rahul Shah

⋅4 months ago⋅Free
Quick Overview This workflow runs at multiple set times during market hours, fetches Murban crude futures prices from OilPrice.com, formats a forward-curve report in code, aggregates the output, and sends the resulting HTML-formatted alert to a Telegram chat. How it works Runs on a schedule at specified weekdays and times to align...

    HTTP Request
    Telegram
    Code

Send Taiwan stock pre-market briefings using TWSE, CNYES, OpenAI and Telegram
Created by: floviq || floviq
floviq

⋅4 months ago⋅Free
Quick overview This workflow runs every weekday morning, fetches the latest available TWSE institutional trading and market data plus CNYES headlines, summarizes it with OpenAI into a short briefing, and sends the result as plain text to a Telegram chat. How it works Runs on a cron schedule at 08:00 Monday to Friday in Asia/Taipei...

    HTTP Request
    Telegram
    Code
    +1

Generate crypto trading signals from Binance data with GPT-4o and Telegram
Created by: Đại Khiêm Như || dainv
Đại Khiêm Như

⋅4 months ago⋅Free
Automated crypto TA scanner that calculates 15+ indicators from Binance data, uses AI to generate objective BUY/SELL/HOLD signals with entry/SL/TP levels, and delivers alerts via Telegram with Google Sheets logging. Who is this for? Crypto traders and enthusiasts who want automated, objective technical analysis of their watchlis...

    Google Sheets
    HTTP Request
    Telegram
    +2

Track WTI crude futures from Oilprice.com and send Telegram alerts
Created by: Rahul Shah || rahulshah111
Rahul Shah

⋅4 months ago⋅Free
Quick overview This workflow runs on a weekday schedule, scrapes WTI crude oil futures prices from Reliable Sources, extracts and formats key contract data with JavaScript, and sends a compact market snapshot to a Telegram chat. How it works Runs on a schedule at specified times on weekdays. Fetches the WTI futures webpage from Oi...

    HTTP Request
    Telegram
    Code

Generate portfolio exposure risk summaries with Sheets, Gemini, Slack, and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Portfolio Exposure Risk Summary Generator &gt; n8n + Google Sheets + Gemini + Slack + Gmail This workflow automatically analyzes portfolio data from Google Sheets on a scheduled basis, calculates exposure metrics such as sector allocation and concentration and generates a professional risk summary using Google Gemini. The report ...

    Google Sheets
    Slack
    Gmail
    +3

Analyze stocks from Telegram using GPT-4, TwelveData, NewsAPI and Chart-IMG
Created by: Jitesh Dugar || jiteshdugar
Jitesh Dugar

⋅4 months ago⋅Free
AI Stock Tracking Agent is a Telegram-based AI workflow built in n8n that transforms a simple stock name into a complete trading analysis report. Users send a stock/company name through Telegram, and the workflow automatically: Converts the company name into a stock symbol Fetches multi-timeframe market data Collects recent stock...

    HTTP Request
    Telegram
    AI Agent
    +2

Generate SENSEX trading signals using Gemini, Yahoo Finance and Google Sheets
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
AI-Powered SENSEX Signal Generator &gt; Gemini, Yahoo Finance & Google Sheets This n8n workflow automatically analyzes SENSEX market data using technical indicators and AI (Google Gemini) to generate trading signals (Buy/Sell). It filters only high-confidence signals and logs them into Google Sheets for tracking. Quick Implement...

    Google Sheets
    HTTP Request
    Code
    +2

Score macro news impact with Groq, SerpAPI, Google Sheets and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Macro News: AI-Driven Market Impact Scoring Automation This workflow is a high-precision financial intelligence engine that monitors macroeconomic news to identify high-impact trading opportunities. It retrieves real-time data via SerpAPI, processes it through a dual-layered engine—combining a custom weighted Rule Engine with Groq...

    Google Sheets
    HTTP Request
    Gmail
    +4

Analyze your stock portfolio daily using Google Sheets, RSS, Groq LLM and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
AI Portfolio Analysis & Reporting using Google Sheets, RSS, Groq LLM & Gmail This n8n workflow automatically analyzes your stock portfolio every day at 4 PM. It fetches portfolio data from Google Sheets, enriches it with latest market news via RSS, generates AI-powered stock insights using LLM models and sends a professional portf...

    Google Sheets
    Gmail
    Code
    +2

Generate daily stock market insights with Alpha Vantage, Google Gemini AI and Slack
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Automated Daily Stock Market Insight Generator &gt; Alpha Vantage, Google Gemini AI and Slack Integration This n8n workflow provides an end-to-end solution for automated financial analysis. By combining real-time market data with generative AI, it transforms raw stock numbers into actionable narrative insights delivered directly ...

    HTTP Request
    Slack
    Code
    +2

Send daily price-drop digest emails for Amazon, Walmart and Google via ScraperAPI
Created by: ScraperAPI || scraperapi
ScraperAPI

⋅4 months ago⋅Free
Track your product wishlist across Amazon, Walmart, and Google and get an email the moment a price drops. How it works Every morning, reads your products from a Data Table and pulls fresh prices from Amazon, Walmart, and Google Shopping via ScraperAPI. Logs every check to a price_history table for trend analysis. Sends a single HTM...

    Send Email
    Gmail
    Code

Extract key earnings insights from Google News RSS and send alerts to Slack with Gemini Pro
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
AI Earnings Analyst &gt; RSS to Slack Automation via Gemini & n8n This workflow automates the tedious task of monitoring financial news by converting raw Google News RSS feeds into structured, actionable insights. Using Gemini Pro, it scans the latest earnings headlines to extract Revenue Trends, Guidance and Surprises, logging th...

    HTTP Request
    Slack
    Basic LLM Chain
    +1

Analyze stocks via Telegram with GPT‑4, TwelveData, NewsAPI and chart images
Created by: Jitesh Dugar || jiteshdugar
Jitesh Dugar

⋅4 months ago⋅Free
AI-Powered Stock Analysis Agent is a Telegram-based AI workflow it transforms a simple stock name into a complete trading analysis report. Users send a stock/company name through Telegram, and the workflow automatically: Converts the company name into a stock symbol Fetches multi-timeframe market data Collects recent stock news P...

    HTTP Request
    Telegram
    AI Agent
    +2

Send hourly cryptocurrency price summaries to Telegram with CoinGecko
Created by: Viktor Mikeska || viktormikeska
Viktor Mikeska

⋅4 months ago⋅Free
This template automatically tracks cryptocurrency prices and sends a formatted summary to your Telegram channel. How it works The workflow triggers every hour (adjustable) and defines a list of assets to track. Real-time market data (price and change) is fetched via the CoinGecko Public API. Individual coin data is aggregated into...

    Telegram
    CoinGecko
    Code

Send AI stock risk alerts from Google Sheets with Twelve Data and Groq
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Google Sheets + Twelve Data + Groq AI Stock Risk Alert Workflow &gt; Smart Stock Risk Alerts in Minutes This workflow automatically reads your stock portfolio from Google Sheets, fetches real-time prices via API, calculates risk metrics (price drops and volatility) and sends AI-generated email alerts only when risks are detected....

    Google Sheets
    HTTP Request
    Gmail
    +3

Send a daily investment research email with Olostep, OpenAI, and Gmail
Created by: Abid Ali Awan || kingabzpro
Abid Ali Awan

⋅4 months ago⋅Free
Daily Investment Research Email with Olostep, OpenAI, and Gmail This n8n template researches a stock watchlist with Olostep, turns the results into a concise OpenAI-generated investment research report, converts the report into a styled HTML email, and sends it with Gmail. It can run manually for testing or automatically at weekd...

    Gmail
    Code
    OpenAI

Track Amazon price-drop alerts with Scavio and Google Sheets
Created by: Scavio AI || scavio-ai
Scavio AI

⋅4 months ago⋅Free
How it works Track any number of Amazon products from a Google Sheet. Every 1,2,3... hours, the workflow: Reads your watchlist sheet (product_url, price_threshold, last_alerted_price) Loops through each product with a 2s throttle (Scavio API rate limit for trail users) Extracts the ASIN and country domain from any Amazon URL form...

    Google Sheets
    Gmail
    Code

Analyze daily stock news sentiment with Gemini AI, Google Sheets and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Stock News Sentiment Automation using Gemini AI, Google Sheets & Gmail This workflow automatically fetches daily stock market news, analyzes sentiment using Gemini AI, calculates impact scores, sends alerts for high-impact news and stores structured results in Google Sheets. Quick Implementation Steps Import the workflow into yo...

    Google Sheets
    HTTP Request
    Gmail
    +2

Send a daily Nifty 50 market brief using Gemini AI, Nifty 50 API and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Daily Market Brief Automation &gt; n8n, Gemini AI, Nifty 50 API & Gmail This workflow automatically generates and emails a concise daily stock market brief at 9:30 AM using real-time Nifty 50 data, financial news and AI-powered insights. Quick Implementation Steps Import the workflow JSON into your n8n account Configure Googl...

    HTTP Request
    Gmail
    Code
    +1

Generate client portfolio summaries using Google Sheets, NewsAPI, Gemini and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Client Portfolio Summary Generator &gt; Google Sheets, NewsAPI, Gemini AI & Gmail This workflow automatically analyzes your stock portfolio whenever a new row is added to Google Sheets. It fetches live stock prices, calculates gains/losses, gathers relevant news, generates a simple AI-powered summary and emails the report to you...

    HTTP Request
    Gmail
    Code
    +1

Analyze corporate action impact from NSE RSS with Google Sheets, Gemini, and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Corporate Actions Impact Analyzer &gt; n8n, NSE RSS, Google Sheets, Gemini AI and Gmail This workflow automatically tracks corporate actions from NSE RSS, matches them with a single client’s portfolio stored in Google Sheets, calculates financial impact using AI and sends a structured email summary. Every run is logged for track...

    Google Sheets
    Gmail
    Code
    +1

Track commodity portfolio drift with Google Sheets, Gemini AI and Gmail alerts
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Commodity Portfolio Tracker using n8n, Google Sheets, Gemini AI & Gmail Alerts This workflow automatically monitors a commodity portfolio stored in Google Sheets, compares actual allocation against predefined targets, detects deviations and sends intelligent rebalance alerts via email using Gemini AI. It also logs every run (succe...

    Google Sheets
    Gmail
    Code
    +1

Monitor futures trades and send risk alerts using Binance, Sheets, Slack and email
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅4 months ago⋅Free
Futures Trade Monitoring & Risk Alert Workflow &gt; n8n, Binance API, Google Sheets, Slack, Telegram, Jira & Email This workflow automates futures trade monitoring by fetching live prices from Binance, calculating trade performance (PnL, ROI, fees), evaluating risk levels and sending alerts across Slack, Telegram, Jira and Email...

    Google Sheets
    HTTP Request
    Slack
    +4

Send Henry Hub natural gas forward curve updates to Telegram with zero API cost
Created by: Rahul Shah || rahulshah111
Rahul Shah

⋅5 months ago⋅Free
Who is this for? Natural gas traders, energy analysts, LNG desk professionals, utility planners, industrial gas buyers, power generation schedulers, pipeline operations teams, commodity research desks, and macro researchers tracking the NYMEX Henry Hub benchmark. If you start your trading day asking "where is Henry Hub spot and wh...

    HTTP Request
    Telegram
    Code

Send daily Brent crude oil futures prices to Telegram with 0 API cost
Created by: Rahul Shah || rahulshah111
Rahul Shah

⋅5 months ago⋅Free
Who is this for? Oil traders, energy analysts, commodity research desks, shipping operations teams, refinery planners, equity investors in oil stocks, macro researchers, and anyone whose day starts with "where is Brent trading?" If you track the international oil benchmark and want hands-free price updates delivered to Telegram mu...

    HTTP Request
    Telegram
    Code

Manage portfolio assets via webhook with Google Sheets and real-time totals
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅5 months ago⋅Free
Webhook-Based Portfolio Manager (n8n + Google Sheets + API) This workflow turns your n8n instance into a portfolio management API using a webhook and Google Sheets. You can add, update or delete assets via a simple POST request and it automatically calculates your total portfolio value in real-time. Quick Implementation Steps Im...

    Google Sheets
    Code

Detect Bitcoin price spikes and send Gemini-powered NewsAPI Gmail alerts
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅5 months ago⋅Free
Bitcoin Price Spike Detector with Gemini AI, NewsAPI & Gmail Alerts This workflow monitors Bitcoin price changes every 30 minutes. If the price increases or decreases by 3% or more, it fetches recent Bitcoin-related news, summarizes it using AI (Google Gemini) and sends an email alert explaining the likely reason behind the price ...

    HTTP Request
    Code
    AI Agent
    +1

Scan biotech news for catalyst trades with FinBERT, Alpaca, and Gemini
Created by: Minibox Digital || tajammul-iqbal
Minibox Digital

⋅5 months ago⋅Free
Automatically scan major financial newswires for biotech catalyst events, score them with AI sentiment analysis, and surface ranked trade candidates — all without manual monitoring. Who's it for Traders and quant hobbyists who follow biotech stocks and want an automated pipeline to flag high-probability catalyst events (FDA approv...

    HTTP Request
    Code
    AI Agent
    +3

Generate daily stock BUY/HOLD/SELL signals with GPT-4o, Gemini, FMP, Sheets and Telegram
Created by: Mo AlBarrak || abomone
Mo AlBarrak

⋅5 months ago⋅Free
Overview This is a production-grade, fully automated stock analysis system built entirely in n8n. It combines institutional-level financial analysis, dual AI model consensus, and a self-improving backtesting loop — all running on autopilot, every single day. Every morning, the engine screens the US stock market, collects deep fina...

    Google Sheets
    HTTP Request
    Telegram
    +3

Track equity sector rotation with Google Sheets, Yahoo Finance, Groq and Gmail
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅5 months ago⋅Free
Sector Rotation Tracker & Alert System of Equity Market This workflow automates the tracking of stock market sector rotation. It fetches a list of active stocks from Google Sheets, pulls their last 5 days of market data from Yahoo Finance and calculates momentum and sector strength using custom code. It then compares this current ...

    Google Sheets
    HTTP Request
    Gmail
    +3

Generate daily investment ideas with Yahoo Finance and Google Gemini
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅5 months ago⋅Free
AI-Powered Daily Investment Idea Generator via Yahoo Finance & Gemini This workflow serves as your personal quantitative analyst. It automatically fetches your active watchlist, grabs real-time prices and breaking news from Yahoo Finance and uses Google Gemini AI to analyze the data and highlight the top 2 to 3 daily investment op...

    HTTP Request
    Code
    AI Agent
    +1

Track multi-chain crypto portfolios and analyze risk with Gemini and QuickNode
Created by: Divyanshu Gupta || divyanshugupta
Divyanshu Gupta

⋅5 months ago⋅Free
This workflow provides a fully automated multi-chain crypto portfolio tracking system powered by AI. It fetches wallet balances and gas prices across multiple blockchain networks (e.g., Ethereum, Polygon, and more via QuickNode), retrieves real-time token prices, and calculates total portfolio value in USD. Using an AI agent, it ...

    HTTP Request
    Slack
    Code
    +3

Generate Indian stock investment ideas using Groq AI, Google Sheets and stock API
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅5 months ago⋅Free
AI Investment Idea Generator using n8n, Groq AI, Google Sheets & Stock API This workflow automatically generates 2–3 high-quality Indian stock investment ideas daily by combining trending stock data + latest market news, processing it with AI (Groq/OpenAI), avoiding duplicates using Google Sheets and storing results for tracking. ...

    Google Sheets
    HTTP Request
    Gmail
    +4

Analyze stocks in Warren Buffett style from Telegram with OpenAI and Gmail
Created by: Sankar Battula || sankarbattula
Sankar Battula

⋅5 months ago⋅Free
This workflow turns a simple Telegram message into a full stock research report inspired by Warren Buffett’s value investing approach. A user sends a ticker symbol such as AAPL, MSFT, or AMZN, and the workflow validates the input, runs AI-powered research, performs discounted cash flow calculations, and sends a polished HTML report...

    Telegram
    Gmail
    AI Agent
    +3

Send a daily AI crypto news digest from Brave Search to Telegram with GPT-4.1-mini
Created by: LukaszB || lukaszb
LukaszB

⋅5 months ago⋅Free
Crypto News Digest — Daily Telegram Bot Automatically fetch the latest crypto headlines every morning and receive a clean AI-generated summary straight to your Telegram — fully hands-off once activated. What This Workflow Does Every day at a scheduled time, this workflow pulls the freshest cryptocurrency news from Brave Search, ...

    Telegram
    Code
    Basic LLM Chain
    +1

Send a daily stock movers and news email digest via Google Sheets, EODHD and Gmail
Created by: Kevin Meneses || pythonia-kevin
Kevin Meneses

⋅6 months ago⋅Free
What this workflow does This workflow automatically generates a daily stock market email digest, combining price movements and recent financial news into a clean, actionable report. Instead of manually checking charts and news every morning, this workflow does it for you. It combines: Market data from EODHD APIs Financial news...

    Google Sheets
    HTTP Request
    Gmail
    +1

Generate institutional-style stock price targets and BUY/HOLD/SELL alerts with ChatGPT and Gemini
Created by: Mo AlBarrak || abomone
Mo AlBarrak

⋅6 months ago⋅Free
AI Institutional Stock Valuation Engine with Risk Scoring & Scenario Targets A professional-grade AI equity analysis automation built on n8n that ingests live financial data and news, runs it through a dual-LLM valuation engine with a built-in tiebreaker, and delivers disciplined Bear/Base/Bull price targets, BUY/HOLD/SELL verdict...

    Google Sheets
    HTTP Request
    Telegram
    +3

Control AlphaInsider stock and crypto portfolios from Telegram text and voice
Created by: AlphaInsider || alphainsider
AlphaInsider

⋅6 months ago⋅Free
AlphaInsider Telegram Chat Bot Automate trading on AlphaInsider by monitoring Telegram messages. Uses AI to analyze signals and execute trades, create posts, or answer questions. How It Works Message Flow: Telegram → Route (DM/Channel) → Detect Type (Text/Voice) → Transcribe (if voice) → Global Settings → Fetch Positions → AI An...

    HTTP Request
    Telegram
    Code
    +6

Generate institutional-grade stock price targets and BUY/HOLD/SELL signals with GPT-5, Gemini, Alpha Vantage and Google Sheets
Created by: Mo AlBarrak || abomone
Mo AlBarrak

⋅7 months ago⋅Free
A professional AI equity analysis automation built on n8n that transforms structured financial data and real-time news into disciplined, risk-adjusted price targets and actionable BUY/HOLD/SELL signals — delivered through automation channels like Telegram or dashboards. Key Features Automated Fundamental & News Parsing: Ingests f...

    Google Sheets
    HTTP Request
    Telegram
    +3

Export your daily Binance spot portfolio to Google Sheets
Created by: Thibaut TRESSE || ttresse
Thibaut TRESSE

⋅7 months ago⋅Free
What this workflow does This workflow automatically exports your Binance spot portfolio positions to Google Sheets on a daily bas...

    Google Sheets
    HTTP Request
    Crypto

Track CoinMarketCap crypto sector pumps with Gemini AI and send digests to Discord
Created by: M Ayoub || mayoub
M Ayoub

⋅8 months ago⋅Free
Who is this for? Crypto traders, researchers, and investors who want to identify trending market narratives and sector rotations before they become mainstream news. What it does Automatically detects which crypto sectors are gaining momentum by analyzing top gainers, groups tokens by narrative (AI, DeFi, Meme, Gaming, RWA, etc.)...

    HTTP Request
    Discord
    Code
    +1

Generate intraday AAPL trade signals using live data, OpenAI, Telegram and Notion
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅$50
📘 Description This workflow automates short-interval market signal evaluation for intraday trading using live technical indicators and deterministic decision logic. It is designed for traders, analysts, and automation teams who want fast, auditable trade signals without manual chart monitoring or subjective interpretation. On a f...

    HTTP Request
    Telegram
    Gmail
    +5

Generate daily stock buy/sell signals using technical indicators and Google Sheets
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅Free
📊 Description This automation calculates commonly used technical indicators for selected stocks and presents the results in a simple, structured dashboard. It removes the need for manual chart analysis by automatically fetching price data, calculating indicators, and generating clear Buy, Sell, or Neutral signals. The workflow is ...

    Google Sheets
    HTTP Request
    Gmail
    +1

Log daily Interactive Brokers trades to a Google Sheets journal
Created by: Wolfgang Renner || naviqo
Wolfgang Renner

⋅9 months ago⋅Free
Automated Trade Report from Interactive Brokers This workflow is aimed at traders who use Interactive Brokers. It automatically retrieves the trades made in IBKR on a daily basis and writes them to a Google Sheet, so that anyone can easily perform further analyses and statistics using the on-board tools. This creates an automatic...

    Google Sheets
    HTTP Request
    Code

Create and manage ERC-20 tokens with a Telegram bot and 1Shot API wallets
Created by: 1Shot API || oneshotapi
1Shot API

⋅9 months ago⋅Free
Launch ERC-20 Tokens with Telegram Bot and 1Shot API Custodial Wallets Find the full walk-through tutorial video for this workflow on YouTube. This Telegram bot template demonstrates some useful patterns for creating crypto-powered multi-user bot applications like: How to create custodial wallets tied to specific telegram use...

    Telegram
    Code

Analyze crypto markets with CoinGecko MCP and C1
Created by: Thesys || thesys
Thesys

⋅8 months ago⋅Free
Analyze crypto markets with interactive graphs using CoinGecko and C1 by Thesys This n8n template can answer questions about real-time prices, market moves, trending coins, and token details with interactive UI in real time (cards, charts, buttons) instead of plain text using C1 by Thesys. Data is fetched through the CoinGecko F...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Analyze stock sentiment with GPT-4o and create Asana tasks with Slack alerts
Created by: Rahul Joshi || rahul08
Rahul Joshi

⋅8 months ago⋅Free
📘 Description This workflow analyzes real-time stock market sentiment and intent from public social media discussions and converts those signals into operations-ready actions. It exposes a webhook endpoint where a stock-market–related query can be submitted (for example, a stock, sector, index, or market event). The workflow the...

    Asana
    Slack
    Code
    +4

Send crypto BUY/SELL alerts for top 5 coins with OpenAI, WhatsApp, Telegram, and email
Created by: Mohamed Abubakkar || mohamed-abubakkar
Mohamed Abubakkar

⋅8 months ago⋅Free
Overview This workflow is designed to monitor the Top 5 cryptocurrencies in real-time, calculate trading signals (BUY, SELL, HOLD), and send human-readable alerts through multiple channels. It integrates data fetching, signal processing, AI-generated insights, and multi-channel notifications to provide a professional-grade crypto ...

    Send Email
    HTTP Request
    Telegram
    +4

Monitor High-Value USDT Transfers on Ethereum with Airtable and Slack Alerts
Created by: WeblineIndia || weblineindia
WeblineIndia

⋅9 months ago⋅Free
Smart Contract Event Monitor (Web3) This workflow automatically monitors the Ethereum blockchain, extracts USDT transfer events, filters large-value transactions, stores them in Airtable and sends a clean daily summary alert to Slack. This workflow checks the latest Ethereum block every day and identifies high-value USDT transfer...

    Airtable
    HTTP Request
    Slack
    +1

Discover, Enrich & Store Cryptocurrency Data with CoinMarketCap API
Created by: Itunu || e2nu
Itunu

⋅10 months ago⋅Free
CoinMarketCap Token Discovery (Free API) Automatically discover cryptocurrency tokens from CoinMarketCap, clean the data, enrich it with official websites, and store the results in your preferred database or sheet. This workflow is designed to be safe for free API usage, easy to understand, and ready for extension. What This Wo...

    HTTP Request
    NocoDB
    Code

Monitor Cryptocurrency Payments Across Multiple Blockchains with AgentGatePay
Created by: AgentGatePay || agentgatepay
AgentGatePay

⋅9 months ago⋅Free
AgentGatePay N8N Quick Start Guide Get your AI agents paying for resources autonomously in under 10 minutes. &gt; ⚠️ BETA VERSION: These templates are currently in beta. We're actively adding features and improvements based on user feedback. Expect updates for enhanced functionality, additional blockchain networks, and new paymen...

    HTTP Request
    Code

Create a Cryptocurrency-Powered API for Selling Resources with AgentGatePay
Created by: AgentGatePay || agentgatepay
AgentGatePay

⋅9 months ago⋅Free
AgentGatePay N8N Quick Start Guide Get your AI agents paying for resources autonomously in under 10 minutes. &gt; ⚠️ BETA VERSION: These templates are currently in beta. We're actively adding features and improvements based on user feedback. Expect updates for enhanced functionality, additional blockchain networks, and new paymen...

    HTTP Request
    Code

Create Autonomous Payment Agents using AgentGatePay and Multi-Chain Tokens
Created by: AgentGatePay || agentgatepay
AgentGatePay

⋅9 months ago⋅Free
AgentGatePay N8N Quick Start Guide Get your AI agents paying for resources autonomously in under 10 minutes. &gt; ⚠️ BETA VERSION: These templates are currently in beta. We're actively adding features and improvements based on user feedback. Expect updates for enhanced functionality, additional blockchain networks, and new paymen...

    HTTP Request
    Code

Generate AI Stock Reports w/ Fundamental, Technical, & News Analysis (Free APIs)
Created by: Deven G || deveng7
Deven G

⋅9 months ago⋅Free
This template deploys a multi-agent system that fully automates advanced stock analysis. It uses a central AI orchestrator to call specialized sub-workflows, synthesizing technical, fundamental, and news sentiment data into a single, actionable report delivered to your inbox. All API Keys can be acquired for free! How it Works Or...

    Send Email
    HTTP Request
    Code
    +8

Monitor Bitcoin Arbitrage Between Binance & Upbit with GPT Analysis & Email
Created by: GYEONGJUN CHAE || jun
GYEONGJUN CHAE

⋅9 months ago⋅Free
Crypto Arbitrage Analyzer: Binance vs Upbit (Kimchi Premium) Short Description Automate crypto arbitrage monitoring between Binance and Upbit. Track the "Kimchi Premium," analyze BTC price gaps with AI, and receive actionable trading reports via email. Full Description 🚀 Overview This workflow serves as an automated analyst for...

    HTTP Request
    Gmail
    AI Agent
    +2

AI Trading Assistant for Telegram using chatGPT-4o (with Position Sizing)
Created by: Cj Elijah Garay || elijahbuilds-ai
Cj Elijah Garay

⋅9 months ago⋅$120
MT5 AI Trading Assistant - Telegram Bot Workflow with position sizing capabilities Open trades for forex/xauusd/gold with this n8n template. It demonstrates how to automate MetaTrader 5 trading executions through natural language commands via Telegram, enabling hands-free trade management with AI-powered intent classification and ...

    HTTP Request
    Telegram
    Code
    +2

Aggregate Financial Regulatory News with ScrapeGraphAI, Slack Alerts & Google Sheets
Created by: vinci-king-01 || vinci-king-01
vinci-king-01

⋅10 months ago⋅Free
Daily Stock Regulatory News Aggregator with Compliance Alerts and Google Sheets Tracking 🎯 Target Audience Compliance officers and regulatory teams Financial services firms monitoring regulatory updates Investment advisors tracking regulatory changes Risk management professionals Corporate legal departments Stock traders and anal...

    Google Sheets
    Slack
    Code

Automate Cryptocurrency Funding Fee Tracking with Binance API and Airtable
Created by: Mark Shcherbakov || lowcodingdev
Mark Shcherbakov

⋅a year ago⋅Free
Video Guide I prepared a detailed guide that showed the whole process of integrating the Binance API and storing data in Airtable to manage funding statements associated with tokens in a wallet. Youtube Link Who is this for? This workflow is ideal for developers, financial analysts, and cryptocurrency enthusiasts who want to a...

    Airtable
    HTTP Request
    Crypto

Monitor USDT ERC-20 Wallet Balance with Etherscan and Telegram Notifications
Created by: FORK SOFTWARE TECHNOLOGIES INC. || fork
FORK SOFTWARE TECHNOLOGIES INC.

⋅a year ago⋅Free
Overview This n8n workflow is specifically designed to monitor the USDT ERC-20 balance within a specific wallet. It uses Etherscan's public blockchain database, which does not require API authentication, to periodically check and process transaction data. This workflow is ideal for users who need an automated solution to track ER...

    HTTP Request
    Telegram
    Code

Post Hourly Crypto Market Summaries via Coingecko to X and to Email
Created by: Badr || b4dr
Badr

⋅2 years ago⋅$5
Description This workflow, delivers real-time cryptocurrency market updates (default: Bitcoin) by fetching data from the CoinGecko API. It formats the information into a visually engaging message and shares it on X (formerly Twitter) and via email. The workflow is set to trigger hourly but is fully customizable to suit different ...

    HTTP Request
    X (Formerly Twitter)
    Gmail
    +1

Binance SM 15min Indicators Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A short-term technical analysis agent for 15-minute candles on Binance Spot Market pairs. Calculates and interprets key trading indicators (RSI, MACD, BBANDS, ADX, SMA/EMA) and returns structured summaries, optimized for Telegram or downstream AI trading agents. This tool is designed to be triggered by another workflow (such as th...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Currency Conversion Workflow
Created by: Mauricio Perera || rckflr
Mauricio Perera

⋅2 years ago⋅$25
Purpose: This workflow exemplifies a sophisticated yet pragmatic mechanism for automating currency conversions by leveraging simple HTTP queries routed through a webhook. By intercepting user requests, sourcing real-time exchange rate data via Google search results, and formatting the data into actionable responses, it obviates the...

    HTTP Request
    HTML

Get Real-time NFT Marketplace Insights with OpenSea Marketplace Agent Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Track NFT listings, offers, orders, and trait-based pricing in real time! This workflow integrates OpenSea API, AI-powered analytics (GPT-4o-mini), and n8n automation to provide instant insights into NFT trading activity. Ideal for NFT traders, collectors, and investors looking to monitor the market and identify profitable opportun...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Check Tron Wallet USDT Blacklist Status via Telegram
Created by: FORK SOFTWARE TECHNOLOGIES INC. || fork
FORK SOFTWARE TECHNOLOGIES INC.

⋅a year ago⋅Free
Description This n8n workflow template allows users to check if a Tron wallet address is blacklisted on the USDT contract via a Telegram bot. When a user sends the command {walletAddress} through the Telegram bot, the workflow queries the Tronscan API to determine if the provided wallet address is blacklisted. The result is then s...

    HTTP Request
    Telegram
    Code

Binance SM Indicators Webhook Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
This workflow acts as a central API gateway for all technical indicator agents in the Binance Spot Market Quant AI system. It listens for incoming webhook requests and dynamically routes them to the correct timeframe-based indicator tool (15m, 1h, 4h, 1d). Designed to power multi-timeframe analysis at scale. 🎥 Watch Tutorial: 🎯...

    HTTP Request
    Code

Crypto RSI Alert System with EODHD, Telegram and TradingView Charts
Created by: Kevin Meneses || pythonia-kevin
Kevin Meneses

⋅a year ago⋅Free
How it works Runs on a schedule and iterates a watchlist of symbols (e.g., BTC/ETH/SOL). For each symbol, request intraday 1h OHLCV from EODHD. A Code node computes Wilder’s RSI(14) and detects 30/70 crossings. When a signal appears, the bot sends a Telegram alert (HTML message) with price, RSI (prev → now), timestamp, and a “V...

    HTTP Request
    Telegram
    Code

Binance SM 1hour Indicators Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
🧪 Binance SM 1hour Indicators Tool A precision trading signal engine that interprets 1-hour candlestick indicators for Binance Spot Market pairs using a GPT-4.1-mini LLM. Ideal for swing traders seeking directional bias and momentum clarity across medium timeframes. 🎥 Watch Tutorial: 🎯 Purpose This tool provides a structured...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Send Cryptocurrency Price Threshold Alerts from CoinGecko to Discord
Created by: LukaszB || lukaszb
LukaszB

⋅a year ago⋅Free
Crypto Price Alert – n8n Workflow A simple and effective crypto alert system for anyone who wants to stay up to date with coin price changes — without refreshing charts all day. This workflow checks the current price of your chosen cryptocurrency (via CoinGecko) and sends you an alert on Discord if it goes above or below your targ...

    Discord
    CoinGecko

Binance SM Price-24hrStats-OrderBook-Kline Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A powerful sub-agent that collects real-time market structure data from Binance for any trading pair — including price, volume, order book depth, and candlestick snapshots across multiple timeframes (15m, 1h, 4h, 1d). 🎥 Watch Tutorial: 🎯 Purpose This workflow powers the Quant AI system with: ✅ Real-time price feed (/ticker/pr...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Analyze NFT Market Trends with AI-Powered OpenSea Analytics Agent Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Get deep insights into NFT market trends, sales data, and collection statistics—all powered by AI and OpenSea! This workflow connects GPT-4o-mini, OpenSea API, and n8n automation to provide real-time analytics on NFT collections, wallet transactions, and market trends. It is ideal for NFT traders, collectors, and investors looking ...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Binance SM 4hour Indicators Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A medium-term trend analyzer for the Binance Spot Market that leverages core technical indicators across 4-hour candle data to provide human-readable swing-trade signals via AI. 🎥 Watch Tutorial: 🎯 What It Does Accepts a Binance trading pair (e.g., AVAXUSDT) Sends the symbol to an internal webhook for technical indicator calcu...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Binance SM 1day Indicators Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
This advanced agent analyzes long-term price action in the Binance Spot Market using 1-day candles. It calculates key macro indicators like RSI, MACD, BBANDS, EMA, SMA, and ADX to identify high-confidence trend setups and market momentum. Used by the Quant AI system for directional bias and macro-level signal validation. 🎥 Watch ...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Tesla 15min Indicators Tool (Short-Term AI Technical Analysis)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
⏱️ Analyze Tesla (TSLA) short-term market structure and momentum using 6 technical indicators on the 15-minute timeframe. This AI agent tool is part of the Tesla Quant Trading AI Agent system. It is designed to detect intraday shifts in volatility, trend strength, and potential reversal signals. ⚠️ Not standalone. This agent is t...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Real-time stock insights using xAI
Created by: DevCode Journey || devcodejourney
DevCode Journey

⋅10 months ago⋅$3
Who is this for? This n8n workflow is designed for investors, financial analysts, automated trading system developers, and finance enthusiasts who require daily, comprehensive, data-driven insights into specific stock symbols. It's perfect for users who need to automate the complex process of combining technical indicators, news se...

    HTTP Request
    Telegram
    Code
    +4

AI-Powered automated news (stock, economy...) collector with expert comment
Created by: Nguyễn Thiệu Toàn (Jay Nguyen) || nguyenthieutoan
Nguyễn Thiệu Toàn (Jay Nguyen)

⋅10 months ago⋅$39
What is This Workflow? V2 (2026) available! An intelligent, fully automated news aggregation system that collects articles from multiple sources (RSS feeds + Google Search), uses AI to classify and summarize the most important stories, then delivers a professional HTML email report with expert commentary. Contact to customize this...

    Gmail
    Code
    AI Agent
    +4

Financial News Digest with Google Gemini AI to Outlook Email
Created by: Louis || louisdl
Louis

⋅a year ago⋅$5
🧠 Key Features Looping source scraping: Collects content from news sites you have selected (it might not work for all of them however) HTML extraction & cleaning: Parses, cleans, and filters messy website data to isolate only the most relevant content. AI-powered synthesis: Uses Google Gemini (via LangChain agent) to summarize an...

    HTTP Request
    Microsoft Outlook
    Code
    +3

Stock Market Information Assistant with Telegram, Yahoo Finance, and GPT-4 Nano
Created by: Archit Jain || architjn
Archit Jain

⋅a year ago⋅$25
How it works Listens to Telegram messages to detect stock-related queries. Extracts company name and identifies its exact stock ticker symbol. Searches Yahoo Finance for stock info using the ticker. Fetches and formats the latest stock data like price and key stats. Sends a clean, simplified reply back to the user on Telegram. Se...

    HTTP Request
    Telegram
    AI Agent
    +4

Tesla 1hour & 1day Klines Tool (Candlestick & Volume AI Pattern Detector)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📉 Detect key candlestick reversal patterns and volume divergence on Tesla (TSLA) using GPT-4.1 and real-time OHLCV data. This AI agent evaluates 1-hour and 1-day candles and is an essential part of the Tesla Financial Market Data Analyst Tool. It identifies signals like Doji, Engulfing, Hammer, and volume anomalies to support trad...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Receive Bitcoin, Etherium, Solana, Binance data with Gecko Coin and Gmail
Created by: Ghufran Ridhawi || ghufran-ridhawi
Ghufran Ridhawi

⋅a year ago⋅$5
Who is this for? This workflow is intended for Traders for trading, Crypto Investors, Professionals in Web 3, Web 3 Developers, Crypto Marketers, Web 3 Programmers, especially in the world of Crypto Currency, Blockchain, and all professionals working in the world of Web 3, including agencies or companies that use Web 3 data. Here y...

    HTTP Request
    Gmail
    Code

Generate AI stock trade recommendations from TwelveData, NewsAPI and Gemini via Telegram
Created by: Blukaze Automations || hellopaul
Blukaze Automations

⋅10 months ago⋅$9
Quick overview ZenTrade is an AI-powered trading assistant that combines multi-timeframe analysis, volume confirmation, and news sentiment to generate Buy, Sell, and Hold recommendations with market bias, risk assessment, and trade setups delivered directly to Telegram. How it works ZenTrade analyzes live market data across multip...

    HTTP Request
    Telegram
    Code
    +3

Get Real-time NFT Insights via Telegram with OpenSea & AI (Main Interface)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Track NFT market trends, collections, and trades in real time—directly from Telegram! This master workflow integrates the OpenSea API, GPT-4o-mini AI, and Telegram, allowing users to request natural-language NFT analytics and receive structured insights instantly. Whether you're an NFT trader, collector, or market analyst, this Te...

    Telegram
    AI Agent
    OpenAI Chat Model
    +2

📈 Hourly monitoring of crypto rates with Alpha Vantage API and Google Sheets
Created by: Samir Saci || samirsaci
Samir Saci

⋅a year ago⋅Free
Tags*: Crypto, Currency Exchange, Alpha Vantage API, Google Sheets Context Hi! I’m Samir Saci, a Supply Chain Engineer and Data Scientist based in Paris, and founder of LogiGreen Consulting. I help companies automate data pipelines using APIs, AI agents, and workflow automation to improve operational visibility and decision-mak...

    Google Sheets
    HTTP Request
    Telegram

Get Real-time NFT Insights with OpenSea AI-Powered NFT Agent Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Instantly access NFT metadata, collections, traits, contracts, and ownership details from OpenSea! This workflow integrates GPT-4o-mini AI, OpenSea API, and n8n automation to provide structured NFT data for traders, collectors, and investors. How It Works Receives user queries via Telegram, webhooks, or another connected inter...

    AI Agent
    OpenAI Chat Model
    Simple Memory
    +1

Generate stock trading signals with Gemini 2.5 Pro & TwelveData via Telegram Bot
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose and Audience This n8n workflow template creates an intelligent stock technical analysis system that delivers professional-grade trading signals directly to your Telegram. Designed for retail traders, investors, and financial professionals who want to combine technical analysis with AI-powered insights for better market timi...

    HTTP Request
    Telegram
    Code
    +4

Fetch real-time Coinbase spot market data with GPT-4o + Telegram
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
Coinbase AI Agent instantly fetches real-time market data directly in Telegram! This workflow integrates the Coinbase REST API with Telegram (plus optional AI-powered formatting) to deliver the latest crypto price, order book, candles, and trade stats in seconds. Perfect for crypto traders, analysts, and investors who want action...

    Telegram
    Code
    AI Agent
    +4

Analyze Cryptocurrency Market Data with HTX API, GPT-4o and Telegram
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A fully autonomous, HTX Spot Market AI Agent (Huobi AI Agent) built using GPT-4o and Telegram. This workflow is the primary interface, orchestrating all internal reasoning, trading logic, and output formatting. ⚙️ Core Features 🧠 LLM-Powered Intelligence: Built on GPT-4o with advanced reasoning ⏱️ Multi-Timeframe Support: 15m, 1...

    Telegram
    Code
    AI Agent
    +4

Tesla 1day Indicators Tool (Macro-Level Technical AI)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📅 Analyze Tesla’s daily trading structure with AI using 6 Alpha Vantage indicators. This tool evaluates long-term trend health, volatility patterns, and potential reversal signals at the 1-day timeframe. Designed for use within the Tesla Financial Market Data Analyst Tool, this agent helps swing and position traders anchor macro s...

    AI Agent
    OpenAI Chat Model
    Simple Memory

Tesla 1hour Indicators Tool (Mid-Term Technical Analysis AI)
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
🕒 Evaluate Tesla (TSLA) price action and market structure on the 1-hour timeframe using 6 real-time indicators. This sub-agent is designed to feed mid-term technical insights into the Tesla Financial Market Data Analyst Tool. It uses GPT-4.1 to interpret Alpha Vantage indicator data delivered via secure webhooks. ⚠️ This workflo...

    AI Agent
    OpenAI Chat Model
    Simple Memory

AAVE Portfolio Professional AI Agent | Telegram + Email + GPT-4o + Moralis
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
A next-generation AI-powered DeFi health monitor that tracks wallet positions across Aave V3 using GPT-4o and LangChain. It delivers human-readable reports via Telegram and Gmail, triggered on schedule or manually. Built for professionals monitoring multiple DeFi wallets. 🧩 System Components | Component |...

    Google Sheets
    Telegram
    Gmail
    +3

Tesla Quant Technical Indicators Webhooks Tool
Created by: Don Jayamaha Jr || don-the-gem-dealer
Don Jayamaha Jr

⋅a year ago⋅Free
📡 This workflow serves as the central Alpha Vantage API fetcher for Tesla trading indicators, delivering cleaned 20-point JSON outputs for three timeframes: 15min, 1hour, and 1day. It is required by the following agents: Tesla 15min, 1h, 1d Indicators Tools Tesla Financial Market Data Analyst Tool ✅ Requires an Alpha Vantage Pr...

    HTTP Request
    Code

Forex, Crypto, Mergers and Financial Markets AI Analyst Updates to Telegram
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$35
Purpose & Audience: This workflow is designed for active traders, financial analysts, and market enthusiasts who want to stay informed about high-impact market news without information overload. It targets users interested in Forex, Crypto, Mergers, and general market-moving geopolitical news delivered directly to their Telegram ch...

    HTTP Request
    Telegram
    Code

Automated Stock Sentiment Analysis with Google Gemini and EODHD News API
Created by: Raz Hadas || raz-hadas
Raz Hadas

⋅a year ago⋅Free
Stay ahead of the market with this powerful, automated workflow that performs real-time sentiment analysis on stock market news. By leveraging the advanced capabilities of Google Gemini, this solution provides you with actionable insights to make informed investment decisions. This workflow is designed for investors, traders, and ...

    Google Sheets
    HTTP Request
    Code
    +2

Real-time forex sentiment analysis & alerts with Gemini AI to Discord
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose & Audience Forex Market AI Analyst is an advanced n8n workflow template designed for Forex traders, analysts, prop firms, brokers, and trading communities who need real-time, actionable market intelligence. By combining multi-source news aggregation and AI-powered sentiment analysis, this workflow delivers both quick alerts...

    Discord
    Code
    AI Agent
    +1

Automated stock technical analysis with xAI Grok & multi-channel notifications
Created by: SpaGreen Creative || spagreen
SpaGreen Creative

⋅9 months ago⋅$11
Who is this for? This workflow is designed for stock traders, financial analysts, investment enthusiasts, and anyone interested in automated stock market analysis. It's particularly useful for those who want to make data-driven trading decisions based on technical indicators without spending hours manually analyzing charts and data...

    Google Sheets
    HTTP Request
    Telegram
    +5

Daily AI Stock Briefing Right to Your Email: OpenAI + Tavily + Gmail
Created by: Automate With Marc || marconi
Automate With Marc

⋅a year ago⋅Free
This n8n workflow template uses community nodes and is only compatible with the self-hosted version of n8n. 📈 StockPulse: AI-Picked Daily News for Your Portfolio Stay ahead of the market with this automated, AI-powered stock market news briefing delivered straight to your inbox — no code required. Watch Step-by-step Video Tutor...

    Gmail
    AI Agent
    OpenAI Chat Model
    +1

Automated BTC & ETH market analysis alerts for Discord & Telegram with Gemini AI
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose & Audience This n8n workflow template is crafted for cryptocurrency traders, analysts, and enthusiasts who want to automate professional-grade market update alerts for BTCUSD and ETHUSD pairs. By integrating multiple trusted news sources with advanced AI-driven sentiment analysis, the agent delivers concise, actionable, and...

    Telegram
    Discord
    Code
    +2

Monetize Workflows with x402 Payment Protocol and 1Shot API
Created by: 1Shot API || oneshotapi
1Shot API

⋅a year ago⋅Free
Monetize Your n8n Workflow with x402 This workflow lets you monetize any n8n workflow with the x402 payment protocol. It uses 1Shot API as the onchain transaction fascilitator role. Check out the tutorial video for a complete walkthrough. Setup Create a free 1Shot API account, then go to the API Keys tab and generate a new ...

    Code

Real-Time Bitcoin Price Alerts with Bright Data & n8n
Created by: Yaron Been || yaron-nofluff
Yaron Been

⋅a year ago⋅Free
Description This workflow monitors Bitcoin prices across multiple exchanges and sends you alerts when significant price drops occur. It helps crypto traders and investors identify buying opportunities without constantly watching the markets. Overview This workflow monitors Bitcoin prices across multiple exchanges and sends you a...

    Google Sheets
    HTTP Request
    Gmail
    +2

Weekly financial markets report: Generate with Gemini AI for Telegram & Discord
Created by: Malik Hashir || malikx
Malik Hashir

⋅a year ago⋅$45
Purpose & Overview This workflow is designed for market analysts, traders, and content creators who need a comprehensive, automated solution for generating weekly market intelligence reports. By aggregating and structuring news and forecasts across all major financial sectors, it streamlines the process of delivering actionable wee...

    Telegram
    Discord
    Code
    +3

Automate fundamental stock analysis with FinnHub data and Google Sheets DCF calculator
Created by: AiAgent || lifehacks
AiAgent

⋅9 months ago⋅$20
Quick overview Intrinsic Valuation (DCF): The workflow applies a Discounted Cash Flow (DCF) model, using the calculated TTM FCF as the base for a multi-year explicit forecast, generating a theoretical intrinsic price target for the company’s stock. How it works Data Acquisition & Structuring: The system initiates by securely extra...

    Google Sheets
    HTTP Request
    Code

Crypto Alpha Scanner with OpenAI - On-Chain and Social Alerts to Telegram
Created by: Luka Zivkovic || zivkovic58
Luka Zivkovic

⋅a year ago⋅$29
🎯 What This Does This n8n workflow is a comprehensive crypto intelligence system that monitors multiple data sources simultaneously to identify alpha opportunities, whale movements, and emerging trends before they become mainstream. It's like having a team of crypto analysts working 24/7 to spot the next big move.* Installment ...

    HTTP Request
    Telegram
    Reddit
    +2

Showing 294 out of 294 templates 
