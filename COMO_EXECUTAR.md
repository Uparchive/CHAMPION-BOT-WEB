# 🚀 Como Executar o Champion Bot Web

## ⚠️ PROBLEMA IDENTIFICADO

O erro que você está vendo no console é causado por **política de CORS** (Cross-Origin Resource Sharing). Isso acontece quando você abre o arquivo HTML diretamente no navegador usando `file://`.

### ❌ O que NÃO funciona:
- Abrir o arquivo `index.html` diretamente (duplo clique)
- URLs começando com `file://`

### ✅ SOLUÇÃO: Usar um servidor HTTP local

---

## 📋 OPÇÃO 1: Servidor Python (RECOMENDADO)

### Passo a passo:

1. **Abra o PowerShell** na pasta do projeto
   - Clique com botão direito na pasta
   - Escolha "Abrir no Terminal" ou "Abrir janela do PowerShell aqui"

2. **Execute o servidor:**
   ```powershell
   python -m http.server 8000
   ```

3. **Abra no navegador:**
   ```
   http://localhost:8000/auth.html
   ```

4. **Para parar o servidor:**
   - Pressione `Ctrl + C` no terminal

---

## 📋 OPÇÃO 2: Usar o arquivo BAT (mais fácil)

1. **Duplo clique** no arquivo `start_server.bat`
2. Uma janela será aberta com o servidor rodando
3. Abra o navegador e acesse: `http://localhost:8000/auth.html`

---

## 📋 OPÇÃO 3: Extension Live Server (VS Code)

Se você usa Visual Studio Code:

1. Instale a extensão **Live Server**
2. Clique com botão direito em `auth.html`
3. Escolha "Open with Live Server"

---

## 🔧 Verificar se Python está instalado

No PowerShell ou CMD, digite:
```powershell
python --version
```

Se aparecer algo como `Python 3.x.x`, está instalado! ✅

Se não estiver instalado:
1. Baixe em: https://www.python.org/downloads/
2. Durante a instalação, marque **"Add Python to PATH"**

---

## 🎯 Passo a Passo Completo

### 1️⃣ Iniciar o Servidor
```powershell
cd "C:\Users\Keslly Albuquerque\Desktop\Bot Atualização"
python -m http.server 8000
```

### 2️⃣ Fazer Login
- Abra: `http://localhost:8000/auth.html`
- Use: **Usuario:** Champion Mestre / **Senha:** admin123

### 3️⃣ Acessar o Bot
- Após login, você será redirecionado para `index.html`
- Configure seu token da Deriv
- Inicie o bot!

---

## ⚠️ IMPORTANTE

### Por que preciso de um servidor?

O navegador bloqueia requisições de módulos JavaScript (ES6) quando abertos via `file://` por motivos de segurança. Um servidor HTTP local resolve esse problema.

### É seguro?

✅ Sim! O servidor só roda na sua máquina (localhost)  
✅ Ninguém de fora pode acessar  
✅ Só funciona enquanto o terminal estiver aberto  

---

## 🆘 Problemas Comuns

### "Python não é reconhecido"
**Solução:** Instale o Python ou use a extensão Live Server do VS Code

### Porta 8000 já em uso
**Solução:** Use outra porta:
```powershell
python -m http.server 8080
```
E acesse: `http://localhost:8080/auth.html`

### Ainda dá erro de CORS
**Solução:** Certifique-se de acessar via `http://localhost:8000` e NÃO via `file://`

---

## 🎉 Pronto!

Agora o Champion Bot deve funcionar perfeitamente! 🚀

**Configurações** ⚙️ e **Iniciar Bot** ▶️ devem estar funcionando normalmente.
