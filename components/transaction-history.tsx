"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react'

const transactions = [
  {
    id: "1",
    type: "send",
    asset: "ETH",
    amount: 0.5,
    value: 892.50,
    to: "0x1234...5678",
    timestamp: "2 hours ago",
    status: "confirmed",
    hash: "0xabcd...efgh"
  },
  {
    id: "2",
    type: "receive",
    asset: "USDC",
    amount: 100,
    value: 100.00,
    from: "0x9876...5432",
    timestamp: "1 day ago",
    status: "confirmed",
    hash: "0x1234...abcd"
  },
  {
    id: "3",
    type: "send",
    asset: "UNI",
    amount: 25,
    value: 178.75,
    to: "0x5555...7777",
    timestamp: "3 days ago",
    status: "confirmed",
    hash: "0xffff...eeee"
  },
  {
    id: "4",
    type: "receive",
    asset: "ETH",
    amount: 0.1,
    value: 178.50,
    from: "0x3333...1111",
    timestamp: "1 week ago",
    status: "confirmed",
    hash: "0xaaaa...bbbb"
  }
]

export default function TransactionHistory() {
  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <Card key={tx.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'send' ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'
                }`}>
                  {tx.type === 'send' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-semibold text-white capitalize">
                    {tx.type} {tx.asset}
                  </div>
                  <div className="text-sm text-slate-400">
                    {tx.type === 'send' ? `To: ${tx.to}` : `From: ${tx.from}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  tx.type === 'send' ? 'text-red-400' : 'text-green-400'
                }`}>
                  {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.asset}
                </div>
                <div className="text-sm text-slate-400">
                  ${tx.value.toFixed(2)}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge variant="outline" className="border-green-600 text-green-400">
                  {tx.status}
                </Badge>
                <div className="text-xs text-slate-400">
                  {tx.timestamp}
                </div>
                <ExternalLink className="w-3 h-3 text-slate-500 cursor-pointer hover:text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
