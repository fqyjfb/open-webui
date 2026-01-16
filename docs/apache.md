# 分别托管UI和模型

有时，将Ollama与UI分开托管是有益的，但保留用户共享的RAG和RBAC支持功能：

# Open WebUI 配置

## UI配置

对于UI配置，您可以按以下方式设置Apache VirtualHost：

```
# 假设您在 "server.com" 托管此UI
<VirtualHost 192.168.1.100:80>
    ServerName server.com
    DocumentRoot /home/server/public_html

    ProxyPass / http://server.com:3000/ nocanon
    ProxyPassReverse / http://server.com:3000/
    # 0.5版本后需要
    ProxyPass / ws://server.com:3000/ nocanon
    ProxyPassReverse / ws://server.com:3000/

</VirtualHost>
```

在请求SSL之前，首先启用站点：

`a2ensite server.com.conf` # 这将启用站点。a2ensite是 "Apache 2 Enable Site" 的缩写

```
# 对于SSL
<VirtualHost 192.168.1.100:443>
    ServerName server.com
    DocumentRoot /home/server/public_html

    ProxyPass / http://server.com:3000/ nocanon
    ProxyPassReverse / http://server.com:3000/
    # 0.5版本后需要
    ProxyPass / ws://server.com:3000/ nocanon
    ProxyPassReverse / ws://server.com:3000/

    SSLEngine on
    SSLCertificateFile /etc/ssl/virtualmin/170514456861234/ssl.cert
    SSLCertificateKeyFile /etc/ssl/virtualmin/170514456861234/ssl.key
    SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1

    SSLProxyEngine on
    SSLCACertificateFile /etc/ssl/virtualmin/170514456865864/ssl.ca
</VirtualHost>

```

我在这里使用virtualmin来管理我的SSL集群，但您也可以直接使用certbot或您首选的SSL方法。要使用SSL：

### 前提条件

运行以下命令：

`snap install certbot --classic`
`snap apt install python3-certbot-apache` (这将安装apache插件)。

导航到apache sites-available目录：

`cd /etc/apache2/sites-available/`

如果尚未创建server.com.conf，则创建该文件，包含上述`<virtualhost>`配置（应与您的情况匹配。根据需要修改）。使用不带SSL的版本：

创建完成后，运行 `certbot --apache -d server.com`，这将为您请求并添加/创建SSL密钥，并创建server.com.le-ssl.conf

# 配置Ollama服务器

在您最新安装的Ollama上，确保您已从官方Ollama参考设置了api服务器：

[Ollama FAQ](https://github.com/jmorganca/ollama/blob/main/docs/faq.md)

### 简要说明

该指南似乎与当前Linux上更新的服务文件不匹配。因此，我们将在这里解决它：

除非您从源代码编译Ollama，否则使用标准安装 `curl https://ollama.com/install.sh | sh` 会在 /etc/systemd/system 中创建一个名为 `ollama.service` 的文件。您可以使用nano编辑该文件：

```
sudo nano /etc/systemd/system/ollama.service
```

添加以下行：

```
Environment="OLLAMA_HOST=0.0.0.0:11434" # 这行是必填的。您也可以指定
```

例如：

```
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
Environment="OLLAMA_HOST=0.0.0.0:11434" # 这行是必填的。您也可以指定 192.168.254.109:DIFFERENT_PORT 格式
Environment="OLLAMA_ORIGINS=http://192.168.254.106:11434,https://models.server.city" # 这行是可选的
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/usr/share/games:/snap/bin"

[Install]
WantedBy=default.target
```

按 CTRL+S 保存文件，然后按 CTRL+X

当您的计算机重新启动时，Ollama服务器现在将监听您指定的IP:PORT，在本例中为 0.0.0.0:11434 或 192.168.254.106:11434（无论您的本地IP地址是什么）。确保您的路由器已正确配置，通过将11434转发到您的本地IP服务器，从该本地IP提供页面。

# Ollama模型配置

## 对于Ollama模型配置，使用以下Apache VirtualHost设置：

导航到apache sites-available目录：

`cd /etc/apache2/sites-available/`

`nano models.server.city.conf` # 与您的ollama服务器域匹配

添加包含此示例的以下virtualhost（根据需要修改）：

```

# 假设您在 "models.server.city" 托管此UI
<IfModule mod_ssl.c>
    <VirtualHost 192.168.254.109:443>
        DocumentRoot "/var/www/html/"
        ServerName models.server.city
        <Directory "/var/www/html/">
            Options None
            Require all granted
        </Directory>

        ProxyRequests Off
        ProxyPreserveHost On
        ProxyAddHeaders On
        SSLProxyEngine on

        ProxyPass / http://server.city:1000/ nocanon # 或端口 11434
        ProxyPassReverse / http://server.city:1000/ # 或端口 11434

        SSLCertificateFile /etc/letsencrypt/live/models.server.city/fullchain.pem
        SSLCertificateKeyFile /etc/letsencrypt/live/models.server.city/privkey.pem
        Include /etc/letsencrypt/options-ssl-apache.conf
    </VirtualHost>
</IfModule>
```

您可能需要先启用站点（如果尚未这样做），然后才能请求SSL：

`a2ensite models.server.city.conf`

#### 对于Ollama服务器的SSL部分

运行以下命令：

导航到apache sites-available目录：

`cd /etc/apache2/sites-available/`
`certbot --apache -d server.com`

```
<VirtualHost 192.168.254.109:80>
    DocumentRoot "/var/www/html/"
    ServerName models.server.city
    <Directory "/var/www/html/">
        Options None
        Require all granted
    </Directory>

    ProxyRequests Off
    ProxyPreserveHost On
    ProxyAddHeaders On
    SSLProxyEngine on

    ProxyPass / http://server.city:1000/ nocanon # 或端口 11434
    ProxyPassReverse / http://server.city:1000/ # 或端口 11434

    RewriteEngine on
    RewriteCond %{SERVER_NAME} =models.server.city
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>

```

不要忘记使用 `systemctl reload apache2` 重启/重新加载Apache

在 https://server.com 打开您的站点！

**恭喜**，您的 _**类似Open-AI的Chat-GPT风格UI**_ 现在正在提供具有RAG、RBAC和多模态功能的AI服务！如果您尚未下载Ollama模型，请立即下载！

如果您遇到任何配置错误或问题，请提交问题或参与我们的讨论。这里有很多友好的开发人员可以帮助您。

让我们让这个UI对每个人都更加用户友好！

感谢您选择open-webui作为您的AI UI！

本文档由 **Bob Reyes** 制作，他是来自菲律宾的 **Open-WebUI** 粉丝。