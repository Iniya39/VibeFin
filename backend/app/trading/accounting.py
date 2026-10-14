from typing import Tuple, Dict, Any

def calculate_new_average_cost(
    current_qty: int,
    current_avg_price: float,
    bought_qty: int,
    buy_price: float
) -> Tuple[int, float, float]:
    """
    Weighted Average Cost Accounting Method.
    Returns: (new_total_qty, new_avg_price, new_total_invested)
    """
    if current_qty + bought_qty <= 0:
        return 0, 0.0, 0.0
    
    total_qty = current_qty + bought_qty
    total_cost = (current_qty * current_avg_price) + (bought_qty * buy_price)
    new_avg = total_cost / total_qty
    return total_qty, round(new_avg, 2), round(total_cost, 2)

def calculate_realized_pnl_on_sale(
    current_avg_price: float,
    sold_qty: int,
    sell_price: float,
    fee: float = 0.0
) -> Tuple[float, float, float]:
    """
    Calculate Realized P&L when selling shares.
    Returns: (gross_proceeds, cost_of_shares_sold, net_realized_pnl)
    """
    gross_proceeds = sold_qty * sell_price
    cost_basis = sold_qty * current_avg_price
    gross_pnl = gross_proceeds - cost_basis
    net_realized_pnl = gross_pnl - fee
    return round(gross_proceeds, 2), round(cost_basis, 2), round(net_realized_pnl, 2)

def calculate_holding_metrics(
    quantity: int,
    average_price: float,
    current_price: float
) -> Dict[str, Any]:
    """
    Calculate unrealized P&L and market value for an active holding.
    """
    invested_value = quantity * average_price
    market_value = quantity * current_price
    unrealized_pnl = market_value - invested_value
    unrealized_pnl_pct = (unrealized_pnl / invested_value * 100) if invested_value > 0 else 0.0

    return {
        "quantity": quantity,
        "average_price": round(average_price, 2),
        "current_price": round(current_price, 2),
        "invested_value": round(invested_value, 2),
        "market_value": round(market_value, 2),
        "unrealized_pnl": round(unrealized_pnl, 2),
        "unrealized_pnl_pct": round(unrealized_pnl_pct, 2)
    }
