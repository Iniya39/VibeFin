"""
Reference Market Data for Initial Seeding & Offline Resiliency.
Provides verified market price reference baselines and fundamentals for the 100 Indian stocks.
Ensures zero-delay startup before initial background Yahoo Finance refresh completes.
"""

REFERENCE_STOCK_DATA = {
    # Sector 1: AI, Software & IT Services
    "TCS": {"price": 3850.50, "prev_close": 3820.00, "pe": 28.5, "pb": 13.2, "roe": 48.0, "high_52w": 4585.0, "low_52w": 3313.0, "market_cap": 13950000000000},
    "INFY": {"price": 1820.25, "prev_close": 1805.00, "pe": 26.8, "pb": 7.8, "roe": 31.5, "high_52w": 1991.0, "low_52w": 1358.0, "market_cap": 7560000000000},
    "HCLTECH": {"price": 1740.00, "prev_close": 1725.50, "pe": 27.2, "pb": 6.9, "roe": 26.0, "high_52w": 1888.0, "low_52w": 1209.0, "market_cap": 4720000000000},
    "WIPRO": {"price": 540.80, "prev_close": 535.20, "pe": 24.1, "pb": 3.4, "roe": 14.8, "high_52w": 580.0, "low_52w": 375.0, "market_cap": 2820000000000},
    "TECHM": {"price": 1620.00, "prev_close": 1602.00, "pe": 38.5, "pb": 5.2, "roe": 12.0, "high_52w": 1720.0, "low_52w": 1082.0, "market_cap": 1590000000000},
    "MPHASIS": {"price": 2450.00, "prev_close": 2420.00, "pe": 28.0, "pb": 6.5, "roe": 21.0, "high_52w": 3100.0, "low_52w": 2150.0, "market_cap": 462000000000},
    "PERSISTENT": {"price": 5450.00, "prev_close": 5380.00, "pe": 54.0, "pb": 12.5, "roe": 26.5, "high_52w": 5975.0, "low_52w": 3280.0, "market_cap": 840000000000},
    "COFORGE": {"price": 7800.00, "prev_close": 7690.00, "pe": 52.0, "pb": 11.2, "roe": 22.8, "high_52w": 8500.0, "low_52w": 4287.0, "market_cap": 485000000000},
    "KPITTECH": {"price": 1680.00, "prev_close": 1655.00, "pe": 68.2, "pb": 19.4, "roe": 30.5, "high_52w": 1930.0, "low_52w": 1315.0, "market_cap": 460000000000},
    "TATAELXSI": {"price": 7150.00, "prev_close": 7220.00, "pe": 55.6, "pb": 17.8, "roe": 34.0, "high_52w": 9200.0, "low_52w": 6411.0, "market_cap": 445000000000},

    # Sector 2: Healthcare, Hospitals & Pharmaceuticals
    "SUNPHARMA": {"price": 1880.00, "prev_close": 1860.00, "pe": 41.2, "pb": 6.3, "roe": 16.5, "high_52w": 1960.0, "low_52w": 1100.0, "market_cap": 4510000000000},
    "DRREDDY": {"price": 6450.00, "prev_close": 6390.00, "pe": 20.8, "pb": 3.8, "roe": 20.2, "high_52w": 7100.0, "low_52w": 5212.0, "market_cap": 1070000000000},
    "CIPLA": {"price": 1520.00, "prev_close": 1508.00, "pe": 26.5, "pb": 4.1, "roe": 16.8, "high_52w": 1702.0, "low_52w": 1132.0, "market_cap": 1230000000000},
    "DIVISLAB": {"price": 5600.00, "prev_close": 5540.00, "pe": 72.0, "pb": 10.5, "roe": 13.5, "high_52w": 6100.0, "low_52w": 3350.0, "market_cap": 1490000000000},
    "APOLLOHOSP": {"price": 6950.00, "prev_close": 6880.00, "pe": 78.4, "pb": 12.8, "roe": 18.0, "high_52w": 7450.0, "low_52w": 4725.0, "market_cap": 998000000000},
    "MAXHEALTH": {"price": 960.00, "prev_close": 948.00, "pe": 65.0, "pb": 8.9, "roe": 15.0, "high_52w": 1075.0, "low_52w": 568.0, "market_cap": 932000000000},
    "FORTIS": {"price": 580.00, "prev_close": 572.00, "pe": 62.0, "pb": 4.7, "roe": 8.2, "high_52w": 655.0, "low_52w": 310.0, "market_cap": 438000000000},
    "LUPIN": {"price": 2140.00, "prev_close": 2110.00, "pe": 38.0, "pb": 5.8, "roe": 14.5, "high_52w": 2315.0, "low_52w": 1130.0, "market_cap": 975000000000},
    "AUROPHARMA": {"price": 1460.00, "prev_close": 1445.00, "pe": 24.5, "pb": 2.9, "roe": 13.0, "high_52w": 1572.0, "low_52w": 850.0, "market_cap": 855000000000},
    "ZYDUSLIFE": {"price": 1080.00, "prev_close": 1065.00, "pe": 26.0, "pb": 4.6, "roe": 19.5, "high_52w": 1324.0, "low_52w": 565.0, "market_cap": 1090000000000},

    # Sector 3: Energy, Power & Utilities
    "RELIANCE": {"price": 2860.00, "prev_close": 2845.00, "pe": 25.4, "pb": 2.4, "roe": 9.8, "high_52w": 3217.0, "low_52w": 2220.0, "market_cap": 19350000000000},
    "NTPC": {"price": 410.00, "prev_close": 405.00, "pe": 18.2, "pb": 2.4, "roe": 13.5, "high_52w": 448.0, "low_52w": 230.0, "market_cap": 3970000000000},
    "POWERGRID": {"price": 330.00, "prev_close": 326.00, "pe": 19.8, "pb": 3.4, "roe": 18.2, "high_52w": 366.0, "low_52w": 195.0, "market_cap": 3070000000000},
    "TATAPOWER": {"price": 430.00, "prev_close": 424.00, "pe": 34.0, "pb": 4.1, "roe": 12.5, "high_52w": 494.0, "low_52w": 235.0, "market_cap": 1370000000000},
    "ADANIGREEN": {"price": 1820.00, "prev_close": 1795.00, "pe": 160.0, "pb": 28.0, "roe": 15.0, "high_52w": 2174.0, "low_52w": 880.0, "market_cap": 2880000000000},
    "JSWENERGY": {"price": 710.00, "prev_close": 698.00, "pe": 62.0, "pb": 4.8, "roe": 8.5, "high_52w": 795.0, "low_52w": 372.0, "market_cap": 1240000000000},
    "ONGC": {"price": 290.00, "prev_close": 286.00, "pe": 7.4, "pb": 1.1, "roe": 14.8, "high_52w": 344.0, "low_52w": 180.0, "market_cap": 3650000000000},
    "COALINDIA": {"price": 490.00, "prev_close": 484.00, "pe": 7.8, "pb": 3.2, "roe": 45.0, "high_52w": 543.0, "low_52w": 300.0, "market_cap": 3020000000000},
    "BPCL": {"price": 340.00, "prev_close": 336.00, "pe": 5.9, "pb": 1.7, "roe": 28.0, "high_52w": 395.0, "low_52w": 170.0, "market_cap": 1470000000000},
    "IOC": {"price": 175.00, "prev_close": 173.00, "pe": 6.8, "pb": 1.3, "roe": 21.0, "high_52w": 196.0, "low_52w": 88.0, "market_cap": 2470000000000},

    # Sector 4: Semiconductors & Electronics
    "DIXON": {"price": 14200.00, "prev_close": 13950.00, "pe": 110.0, "pb": 32.0, "roe": 28.0, "high_52w": 15990.0, "low_52w": 5000.0, "market_cap": 850000000000},
    "KAYNES": {"price": 5300.00, "prev_close": 5190.00, "pe": 125.0, "pb": 14.5, "roe": 12.0, "high_52w": 5980.0, "low_52w": 2350.0, "market_cap": 339000000000},
    "SYRMA": {"price": 460.00, "prev_close": 452.00, "pe": 58.0, "pb": 4.5, "roe": 8.0, "high_52w": 690.0, "low_52w": 395.0, "market_cap": 81000000000},
    "MOSCHIP": {"price": 240.00, "prev_close": 234.00, "pe": 280.0, "pb": 22.0, "roe": 8.5, "high_52w": 326.0, "low_52w": 85.0, "market_cap": 45000000000},
    "CYIENTDLM": {"price": 1050.00, "prev_close": 1035.00, "pe": 58.0, "pb": 8.2, "roe": 15.0, "high_52w": 1250.0, "low_52w": 620.0, "market_cap": 83000000000},
    "ASMTEC": {"price": 1480.00, "prev_close": 1450.00, "pe": 82.0, "pb": 12.0, "roe": 14.0, "high_52w": 1820.0, "low_52w": 410.0, "market_cap": 16000000000},
    "RIR": {"price": 1890.00, "prev_close": 1850.00, "pe": 140.0, "pb": 25.0, "roe": 18.0, "high_52w": 2400.0, "low_52w": 420.0, "market_cap": 13000000000},
    "CENTUM": {"price": 1750.00, "prev_close": 1720.00, "pe": 72.0, "pb": 6.5, "roe": 9.5, "high_52w": 2280.0, "low_52w": 1350.0, "market_cap": 22500000000},
    "BEL": {"price": 295.00, "prev_close": 291.00, "pe": 48.0, "pb": 11.2, "roe": 26.0, "high_52w": 340.0, "low_52w": 130.0, "market_cap": 2150000000000},
    "CGPOWER": {"price": 740.00, "prev_close": 728.00, "pe": 95.0, "pb": 28.0, "roe": 32.0, "high_52w": 810.0, "low_52w": 375.0, "market_cap": 1130000000000},

    # Sector 5: Banking
    "HDFCBANK": {"price": 1660.00, "prev_close": 1648.00, "pe": 18.5, "pb": 2.7, "roe": 16.5, "high_52w": 1794.0, "low_52w": 1363.0, "market_cap": 12650000000000},
    "ICICIBANK": {"price": 1240.00, "prev_close": 1228.00, "pe": 18.2, "pb": 3.1, "roe": 18.5, "high_52w": 1340.0, "low_52w": 915.0, "market_cap": 8750000000000},
    "SBIN": {"price": 810.00, "prev_close": 802.00, "pe": 10.4, "pb": 1.6, "roe": 17.0, "high_52w": 912.0, "low_52w": 555.0, "market_cap": 7220000000000},
    "KOTAKBANK": {"price": 1780.00, "prev_close": 1765.00, "pe": 21.0, "pb": 2.9, "roe": 15.0, "high_52w": 1940.0, "low_52w": 1540.0, "market_cap": 3540000000000},
    "AXISBANK": {"price": 1180.00, "prev_close": 1168.00, "pe": 13.8, "pb": 2.1, "roe": 16.8, "high_52w": 1339.0, "low_52w": 950.0, "market_cap": 3650000000000},
    "INDUSINDBK": {"price": 1420.00, "prev_close": 1405.00, "pe": 12.2, "pb": 1.7, "roe": 15.2, "high_52w": 1694.0, "low_52w": 1250.0, "market_cap": 1105000000000},
    "BANKBARODA": {"price": 250.00, "prev_close": 247.00, "pe": 6.8, "pb": 1.1, "roe": 16.5, "high_52w": 298.0, "low_52w": 190.0, "market_cap": 1290000000000},
    "CANBK": {"price": 105.00, "prev_close": 103.50, "pe": 6.2, "pb": 1.0, "roe": 17.5, "high_52w": 128.0, "low_52w": 68.0, "market_cap": 950000000000},
    "PNB": {"price": 105.00, "prev_close": 103.80, "pe": 8.5, "pb": 0.9, "roe": 11.0, "high_52w": 142.0, "low_52w": 65.0, "market_cap": 1150000000000},
    "FEDERALBNK": {"price": 195.00, "prev_close": 192.50, "pe": 11.5, "pb": 1.4, "roe": 14.5, "high_52w": 210.0, "low_52w": 138.0, "market_cap": 475000000000},

    # Sector 6: Steel & Metals
    "TATASTEEL": {"price": 155.00, "prev_close": 153.20, "pe": 32.0, "pb": 1.9, "roe": 6.5, "high_52w": 184.0, "low_52w": 118.0, "market_cap": 1930000000000},
    "JSWSTEEL": {"price": 980.00, "prev_close": 968.00, "pe": 28.5, "pb": 3.1, "roe": 12.0, "high_52w": 1050.0, "low_52w": 740.0, "market_cap": 2390000000000},
    "SAIL": {"price": 135.00, "prev_close": 133.50, "pe": 16.0, "pb": 0.9, "roe": 6.0, "high_52w": 175.0, "low_52w": 82.0, "market_cap": 558000000000},
    "JINDALSTEL": {"price": 960.00, "prev_close": 948.00, "pe": 15.5, "pb": 2.2, "roe": 15.0, "high_52w": 1080.0, "low_52w": 615.0, "market_cap": 980000000000},
    "HINDALCO": {"price": 710.00, "prev_close": 702.00, "pe": 14.2, "pb": 1.5, "roe": 11.5, "high_52w": 772.0, "low_52w": 450.0, "market_cap": 1590000000000},
    "VEDL": {"price": 480.00, "prev_close": 472.00, "pe": 18.0, "pb": 3.8, "roe": 22.0, "high_52w": 523.0, "low_52w": 210.0, "market_cap": 1870000000000},
    "NMDC": {"price": 230.00, "prev_close": 227.00, "pe": 10.5, "pb": 2.4, "roe": 24.0, "high_52w": 286.0, "low_52w": 142.0, "market_cap": 674000000000},
    "NALCO": {"price": 220.00, "prev_close": 216.00, "pe": 16.8, "pb": 2.6, "roe": 15.8, "high_52w": 250.0, "low_52w": 92.0, "market_cap": 404000000000},
    "MOIL": {"price": 410.00, "prev_close": 402.00, "pe": 25.0, "pb": 3.2, "roe": 13.5, "high_52w": 610.0, "low_52w": 215.0, "market_cap": 83500000000},
    "JSL": {"price": 720.00, "prev_close": 710.00, "pe": 21.0, "pb": 4.1, "roe": 21.0, "high_52w": 848.0, "low_52w": 440.0, "market_cap": 593000000000},

    # Sector 7: FMCG & Consumer Goods
    "HINDUNILVR": {"price": 2550.00, "prev_close": 2530.00, "pe": 56.0, "pb": 11.5, "roe": 20.5, "high_52w": 3035.0, "low_52w": 2170.0, "market_cap": 5990000000000},
    "ITC": {"price": 495.00, "prev_close": 490.00, "pe": 29.5, "pb": 8.1, "roe": 29.0, "high_52w": 528.0, "low_52w": 399.0, "market_cap": 6180000000000},
    "NESTLEIND": {"price": 2380.00, "prev_close": 2360.00, "pe": 72.0, "pb": 68.0, "roe": 105.0, "high_52w": 2777.0, "low_52w": 2145.0, "market_cap": 2290000000000},
    "BRITANNIA": {"price": 5800.00, "prev_close": 5740.00, "pe": 62.0, "pb": 38.0, "roe": 58.0, "high_52w": 6470.0, "low_52w": 4400.0, "market_cap": 1395000000000},
    "TATACONSUM": {"price": 1120.00, "prev_close": 1105.00, "pe": 82.0, "pb": 6.2, "roe": 8.0, "high_52w": 1269.0, "low_52w": 850.0, "market_cap": 1090000000000},
    "DABUR": {"price": 550.00, "prev_close": 544.00, "pe": 51.0, "pb": 9.4, "roe": 19.5, "high_52w": 672.0, "low_52w": 489.0, "market_cap": 974000000000},
    "GODREJCP": {"price": 1280.00, "prev_close": 1265.00, "pe": 64.0, "pb": 8.8, "roe": 14.0, "high_52w": 1545.0, "low_52w": 970.0, "market_cap": 1308000000000},
    "MARICO": {"price": 630.00, "prev_close": 624.00, "pe": 52.0, "pb": 19.2, "roe": 37.0, "high_52w": 718.0, "low_52w": 490.0, "market_cap": 815000000000},
    "COLPAL": {"price": 3450.00, "prev_close": 3410.00, "pe": 64.0, "pb": 46.0, "roe": 75.0, "high_52w": 3895.0, "low_52w": 2000.0, "market_cap": 938000000000},
    "VBL": {"price": 610.00, "prev_close": 602.00, "pe": 85.0, "pb": 22.0, "roe": 29.0, "high_52w": 688.0, "low_52w": 395.0, "market_cap": 1980000000000},

    # Sector 8: Automobiles, EVs & Mobility
    "MARUTI": {"price": 12400.00, "prev_close": 12280.00, "pe": 28.0, "pb": 4.1, "roe": 16.0, "high_52w": 13680.0, "low_52w": 9650.0, "market_cap": 3890000000000},
    "M&M": {"price": 3050.00, "prev_close": 3010.00, "pe": 32.0, "pb": 5.4, "roe": 18.0, "high_52w": 3314.0, "low_52w": 1480.0, "market_cap": 3790000000000},
    "MOTHERSON": {"price": 160.00, "prev_close": 158.00, "pe": 38.0, "pb": 4.2, "roe": 14.5, "high_52w": 217.0, "low_52w": 85.0, "market_cap": 1085000000000},
    "HEROMOTOCO": {"price": 5100.00, "prev_close": 5040.00, "pe": 26.0, "pb": 5.8, "roe": 23.0, "high_52w": 6094.0, "low_52w": 2980.0, "market_cap": 1020000000000},
    "BAJAJ-AUTO": {"price": 10200.00, "prev_close": 10080.00, "pe": 36.0, "pb": 9.5, "roe": 28.0, "high_52w": 12774.0, "low_52w": 5050.0, "market_cap": 2860000000000},
    "EICHERMOT": {"price": 4750.00, "prev_close": 4690.00, "pe": 34.0, "pb": 7.2, "roe": 23.5, "high_52w": 5105.0, "low_52w": 3370.0, "market_cap": 1300000000000},
    "TVSMOTOR": {"price": 2550.00, "prev_close": 2515.00, "pe": 54.0, "pb": 15.5, "roe": 30.5, "high_52w": 2959.0, "low_52w": 1530.0, "market_cap": 1210000000000},
    "ASHOKLEY": {"price": 225.00, "prev_close": 221.50, "pe": 25.0, "pb": 6.2, "roe": 28.0, "high_52w": 264.0, "low_52w": 157.0, "market_cap": 660000000000},
    "OLECTRA": {"price": 1650.00, "prev_close": 1625.00, "pe": 160.0, "pb": 14.5, "roe": 9.5, "high_52w": 2222.0, "low_52w": 1050.0, "market_cap": 135000000000},
    "SONACOMS": {"price": 690.00, "prev_close": 680.00, "pe": 74.0, "pb": 13.0, "roe": 19.5, "high_52w": 769.0, "low_52w": 510.0, "market_cap": 405000000000},

    # Sector 9: Financial Services & Capital Markets
    "BAJFINANCE": {"price": 7150.00, "prev_close": 7080.00, "pe": 29.0, "pb": 5.2, "roe": 21.0, "high_52w": 8192.0, "low_52w": 6160.0, "market_cap": 4420000000000},
    "BAJAJFINSV": {"price": 1780.00, "prev_close": 1762.00, "pe": 34.0, "pb": 4.1, "roe": 13.5, "high_52w": 2030.0, "low_52w": 1420.0, "market_cap": 2840000000000},
    "SHRIRAMFIN": {"price": 3250.00, "prev_close": 3210.00, "pe": 15.2, "pb": 2.4, "roe": 17.5, "high_52w": 3650.0, "low_52w": 1820.0, "market_cap": 1220000000000},
    "CHOLAFIN": {"price": 1520.00, "prev_close": 1495.00, "pe": 34.0, "pb": 6.8, "roe": 21.5, "high_52w": 1640.0, "low_52w": 1070.0, "market_cap": 1278000000000},
    "MUTHOOTFIN": {"price": 1920.00, "prev_close": 1890.00, "pe": 17.0, "pb": 3.0, "roe": 19.0, "high_52w": 2088.0, "low_52w": 1210.0, "market_cap": 770000000000},
    "SBICARD": {"price": 720.00, "prev_close": 714.00, "pe": 28.0, "pb": 5.4, "roe": 20.0, "high_52w": 815.0, "low_52w": 670.0, "market_cap": 685000000000},
    "HDFCAMC": {"price": 4350.00, "prev_close": 4290.00, "pe": 44.0, "pb": 13.0, "roe": 32.0, "high_52w": 4720.0, "low_52w": 2630.0, "market_cap": 928000000000},
    "CAMS": {"price": 4450.00, "prev_close": 4390.00, "pe": 54.0, "pb": 21.0, "roe": 42.0, "high_52w": 4910.0, "low_52w": 2350.0, "market_cap": 219000000000},
    "BSE": {"price": 4650.00, "prev_close": 4580.00, "pe": 68.0, "pb": 16.5, "roe": 28.0, "high_52w": 4900.0, "low_52w": 1950.0, "market_cap": 629000000000},
    "MCX": {"price": 5850.00, "prev_close": 5760.00, "pe": 82.0, "pb": 18.0, "roe": 24.0, "high_52w": 6900.0, "low_52w": 2800.0, "market_cap": 298000000000},

    # Sector 10: Infrastructure, Industrials & Engineering
    "LT": {"price": 3620.00, "prev_close": 3585.00, "pe": 36.0, "pb": 5.1, "roe": 15.0, "high_52w": 3948.0, "low_52w": 2870.0, "market_cap": 4980000000000},
    "ADANIENT": {"price": 3120.00, "prev_close": 3080.00, "pe": 105.0, "pb": 7.8, "roe": 8.0, "high_52w": 3743.0, "low_52w": 2140.0, "market_cap": 3550000000000},
    "ADANIPORTS": {"price": 1410.00, "prev_close": 1395.00, "pe": 32.0, "pb": 4.5, "roe": 15.5, "high_52w": 1607.0, "low_52w": 750.0, "market_cap": 3045000000000},
    "ULTRACEMCO": {"price": 11200.00, "prev_close": 11080.00, "pe": 44.0, "pb": 4.8, "roe": 11.5, "high_52w": 12100.0, "low_52w": 7950.0, "market_cap": 3230000000000},
    "GRASIM": {"price": 2680.00, "prev_close": 2650.00, "pe": 31.0, "pb": 1.7, "roe": 6.0, "high_52w": 2874.0, "low_52w": 1850.0, "market_cap": 1780000000000},
    "ABB": {"price": 8150.00, "prev_close": 8040.00, "pe": 110.0, "pb": 27.0, "roe": 26.0, "high_52w": 9149.0, "low_52w": 3850.0, "market_cap": 1727000000000},
    "SIEMENS": {"price": 7450.00, "prev_close": 7360.00, "pe": 98.0, "pb": 19.5, "roe": 21.0, "high_52w": 8130.0, "low_52w": 3320.0, "market_cap": 2650000000000},
    "VOLTAS": {"price": 1760.00, "prev_close": 1735.00, "pe": 120.0, "pb": 8.9, "roe": 8.5, "high_52w": 1940.0, "low_52w": 815.0, "market_cap": 582000000000},
    "TITAGARH": {"price": 1320.00, "prev_close": 1295.00, "pe": 62.0, "pb": 10.5, "roe": 19.0, "high_52w": 1896.0, "low_52w": 750.0, "market_cap": 177000000000},
    "RVNL": {"price": 470.00, "prev_close": 462.00, "pe": 64.0, "pb": 12.0, "roe": 20.0, "high_52w": 647.0, "low_52w": 140.0, "market_cap": 980000000000},
}
