# Open WebUI 故障排除指南

## 了解 Open WebUI 架构

Open WebUI 系统设计用于简化客户端（浏览器）与 Ollama API 之间的交互。该设计的核心是后端反向代理，用于增强安全性并解决 CORS 问题。

- **工作原理**：Open WebUI 设计为通过特定路由与 Ollama API 交互。当从 WebUI 向 Ollama 发出请求时，请求不会直接发送到 Ollama API。最初，请求通过 `/ollama` 路由发送到 Open WebUI 后端。然后，后端负责将请求转发到 Ollama API。这种转发通过 `OLLAMA_BASE_URL` 环境变量中指定的路由完成。因此，在 WebUI 中向 `/ollama` 发出的请求实际上等同于在后端向 `OLLAMA_BASE_URL` 发出的请求。例如，在 WebUI 中向 `/ollama/api/tags` 发出的请求等同于在后端向 `OLLAMA_BASE_URL/api/tags` 发出的请求。

- **安全优势**：这种设计可防止 Ollama API 直接暴露给前端，从而防止潜在的 CORS（跨域资源共享）问题和未授权访问。要求通过身份验证访问 Ollama API 进一步增强了这一安全层。

## Open WebUI：服务器连接错误

如果您遇到连接问题，通常是因为 WebUI Docker 容器无法在容器内部访问位于 127.0.0.1:11434（host.docker.internal:11434）的 Ollama 服务器。在 Docker 命令中使用 `--network=host` 标志来解决此问题。请注意，端口会从 3000 更改为 8080，因此链接变为：`http://localhost:8080`。

**示例 Docker 命令**：

```bash
docker run -d --network=host -v open-webui:/app/backend/data -e OLLAMA_BASE_URL=http://127.0.0.1:11434 --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

### Ollama 响应缓慢的错误

Open WebUI 为 Ollama 生成响应设置了默认 5 分钟的超时时间。如果需要，可以通过环境变量 AIOHTTP_CLIENT_TIMEOUT 调整，该变量以秒为单位设置超时时间。

### 一般连接错误

**确保 Ollama 版本是最新的**：始终首先检查您是否拥有最新版本的 Ollama。访问 [Ollama 官方网站](https://ollama.com/) 获取最新更新。

**故障排除步骤**：

1. **验证 Ollama URL 格式**：
   - 运行 Web UI 容器时，确保 `OLLAMA_BASE_URL` 设置正确。（例如，对于不同的主机设置，使用 `http://192.168.1.1:11434`）。
   - 在 Open WebUI 中，导航至 "设置" > "通用"。
   - 确认 Ollama 服务器 URL 已正确设置为 `[OLLAMA URL]`（例如，`http://localhost:11434`）。

通过遵循这些增强的故障排除步骤，连接问题应该能得到有效解决。如需进一步帮助或查询，请随时通过我们的社区 Discord 联系我们。
