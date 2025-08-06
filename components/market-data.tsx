"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from 'lucide-react'

const marketData = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 43250.00,
    change24h: 2.5,
    volume: "28.5B",
    marketCap: "847.2B",
    icon: "₿"
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 2650.00,
    change24h: -1.2,
    volume: "15.2B",
    marketCap: "318.5B",
    icon: "⟠"
  },
  {
    symbol: "BNB",
    name: "BNB",
    price: 315.50,
    change24h: 4.8,
    volume: "1.8B",
    marketCap: "48.7B",
    icon: "🔶"
  },
  {
    symbol: "ADA",
    name: "Cardano",
    price: 0.485,
    change24h: -3.1,
    volume: "892M",
    marketCap: "17.2B",
    icon: "🔷"
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 98.75,
    change24h: 7.2,
    volume: "2.1B",
    marketCap: "42.8B",
    icon: "🌞"
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    price: 7.25,
    change24h: -0.8,
    volume: "245M",
    marketCap: "9.1B",
    icon: "⚫"
  }
]

export default function MarketData() {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span>Market Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">$1.7T</div>
              <div className="text-sm text-slate-400">Total Market Cap</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">+2.4%</div>
              <div className="text-sm text-slate-400">24h Change</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">$89.2B</div>
              <div className="text-sm text-slate-400">24h Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">47.2%</div>
              <div className="text-sm text-slate-400">BTC Dominance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {marketData.map((coin) => (
          <Card key={coin.symbol} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg">
                    {coin.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{coin.symbol}</div>
                    <div className="text-sm text-slate-400">{coin.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">
                    ${coin.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-400">
                    Vol: {coin.volume}
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={coin.change24h >= 0 ? "default" : "destructive"}
                    className={`${coin.change24h >= 0 ? "bg-green-600" : "bg-red-600"} flex items-center space-x-1`}
                  >
                    {coin.change24h >= 0 ? 
                      <TrendingUp className="w-3 h-3" /> : 
                      <TrendingDown className="w-3 h-3" />
                    }
                    <span>{Math.abs(coin.change24h)}%</span>
                  </Badge>
                  <div className="text-xs text-slate-400 mt-1">
                    MCap: {coin.marketCap}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
