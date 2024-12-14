import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { searchStockSymbols } from "@/app/services/stockSymbols"

interface StockSearchComboboxProps {
  onSelect: (value: string) => void;
}

export function StockSearchCombobox({ onSelect }: StockSearchComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [stocks, setStocks] = React.useState<Array<{ symbol: string; name: string }>>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const debouncedSearch = React.useCallback(
    React.useMemo(
      () =>
        debounce(async (search: string) => {
          if (search.length < 1) {
            setStocks([])
            setError(null)
            setLoading(false)
            return
          }
          setLoading(true)
          setError(null)
          try {
            const results = await searchStockSymbols(search)
            setStocks(results.map(r => ({ symbol: r.symbol, name: r.name })))
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search stocks')
            setStocks([])
          } finally {
            setLoading(false)
          }
        }, 300),
      []
    ),
    []
  )

  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? stocks.find((stock) => stock.symbol === value)?.symbol ?? value
            : "Search for a stock..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Enter stock symbol or name..." 
            onValueChange={value => {
              debouncedSearch(value)
            }}
          />
          <CommandEmpty>
            {loading ? (
              "Searching..."
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              "No stock found."
            )}
          </CommandEmpty>
          <CommandGroup>
            {stocks.map((stock) => (
              <CommandItem
                key={stock.symbol}
                value={stock.symbol}
                onSelect={(currentValue) => {
                  setValue(currentValue)
                  onSelect(currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === stock.symbol ? "opacity-100" : "opacity-0"
                  )}
                />
                {stock.symbol} - {stock.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Debounce helper function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
} {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  return debounced;
}
