# Jupiter Perps JLP API

这是一个提供 Jupiter Perpetuals JLP (Jupiter Liquidity Pool) 信息的 REST API 服务。

## 功能特性

- 🚀 高性能的 JLP 信息查询 API
- 📊 实时获取所有 custody 的详细信息
- 🔄 自动计算 JLP 虚拟价格和总 AUM
- 🐳 Docker 容器化部署
- 🏥 健康检查端点
- 📝 完整的错误处理和日志记录

## API 端点

### 健康检查
```
GET /health
```

**响应示例:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "jupiter-perps-jlp-api"
}
```

### JLP 信息
```
GET /api/jlp-info
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "Supply": "1000000000000",
    "Price": "1234567",
    "TotalAumUsd": "5000000000000",
    "CustodyViews": [
      {
        "symbol": "BTC",
        "pubkey": "5Pv3gM9JrFFH883SWAhvJC9RPYmo8UNxuFtv5bMMALkm",
        "isStable": false,
        "price": "45000000000",
        "owned": "1000000000",
        "locked": "500000000",
        "debt": "0",
        "netAmount": "500000000",
        "decimals": 8,
        "guaranteedUsd": "100000000000",
        "globalShortSizes": "0",
        "globalShortAveragePrices": "0",
        "tradersPnlDelta": "0",
        "tradersHasProfit": false,
        "aumUsd": "225000000000"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 本地开发

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
npm run dev
```

### 构建并运行
```bash
npm run build
npm start
```

## Docker 部署

### 构建镜像
```bash
npm run docker:build
```

### 运行容器
```bash
npm run docker:run
```

### 使用 Docker Compose
```bash
# 设置环境变量
export RPC_URL="https://api.mainnet-beta.solana.com"

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 环境变量

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `PORT` | `3000` | API 服务端口 |
| `RPC_URL` | `https://api.mainnet-beta.solana.com` | Solana RPC 端点 |
| `NODE_ENV` | `production` | 运行环境 |

## 数据说明

### CustodyView 字段说明

- `symbol`: 代币符号 (BTC, ETH, SOL, USDC, USDT)
- `pubkey`: Custody 账户公钥
- `isStable`: 是否为稳定币
- `price`: 代币价格 (以 USDC 计价，6位小数精度)
- `owned`: 实际拥有的代币数量
- `locked`: 锁定的代币数量
- `debt`: 债务数量
- `netAmount`: 净代币数量 (owned - locked)
- `decimals`: 代币精度
- `guaranteedUsd`: 保证的 USD 价值
- `globalShortSizes`: 全局空头仓位大小
- `globalShortAveragePrices`: 全局空头平均价格
- `tradersPnlDelta`: 交易者 PnL 变化
- `tradersHasProfit`: 交易者是否有盈利
- `aumUsd`: 资产管理规模 (USD)

### JLPView 字段说明

- `Supply`: JLP 代币总供应量
- `Price`: JLP 虚拟价格
- `TotalAumUsd`: 总资产管理规模 (USD)
- `CustodyViews`: 所有 custody 的详细信息数组

## 错误处理

API 使用标准的 HTTP 状态码：

- `200`: 成功
- `404`: 端点不存在
- `500`: 服务器内部错误

错误响应格式：
```json
{
  "success": false,
  "error": "错误描述",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 性能优化

- 使用 `Promise.all()` 并行获取所有 custody 数据
- 缓存 RPC 连接和程序实例
- 优化的 BN 序列化
- Docker 多阶段构建减小镜像大小

## 监控和日志

- 健康检查端点用于负载均衡器监控
- 控制台日志记录所有请求和错误
- Docker 健康检查自动重启不健康的容器
