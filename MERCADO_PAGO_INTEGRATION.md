# 💳 Integração Mercado Pago - Champion Bot

## 🎯 **O Que Foi Implementado**

O **Plano Mensal (R$ 25,00)** agora tem integração automática com **Mercado Pago** usando assinatura recorrente!

---

## ✨ **Funcionalidades**

### 💰 **Assinatura Recorrente**
- ✅ Pagamento automático todo mês
- ✅ Usuário não precisa renovar manualmente
- ✅ Renovação automática no Mercado Pago
- ✅ Processamento seguro pelo Mercado Pago

### 🔄 **Fluxo Automático**
1. Usuário escolhe **Plano Mensal** no registro
2. Na página de pagamento, vê o botão **"Assinar com Mercado Pago"**
3. Clica no botão → abre página do Mercado Pago
4. Realiza o pagamento na página segura do MP
5. Ao finalizar → volta para o site automaticamente
6. Conta é criada e ativada automaticamente! ✅

### 📱 **Métodos de Pagamento (Mercado Pago)**
- 💳 Cartão de crédito
- 💰 PIX
- 🏦 Boleto bancário
- 💼 Saldo Mercado Pago

---

## 🔧 **Detalhes Técnicos**

### **ID do Plano de Assinatura:**
```
cde77946d7624bc6aaf5805e635af5fe
```

### **Valores:**
- **Plano Mensal:** R$ 25,00/mês (recorrente)
- **Plano Ilimitado:** R$ 259,90 (pagamento único via PIX)

### **Código Integrado:**

```html
<!-- Botão Mercado Pago -->
<a href="https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=cde77946d7624bc6aaf5805e635af5fe" 
   name="MP-payButton" 
   class='mercado-pago-button'>
    💳 Assinar com Mercado Pago
</a>

<!-- Script do Mercado Pago -->
<script type="text/javascript">
    (function() {
        function $MPC_load() {
            window.$MPC_loaded !== true && (function() {
                var s = document.createElement("script");
                s.type = "text/javascript";
                s.async = true;
                s.src = document.location.protocol + "//secure.mlstatic.com/mptools/render.js";
                var x = document.getElementsByTagName('script')[0];
                x.parentNode.insertBefore(s, x);
                window.$MPC_loaded = true;
            })();
        }
        window.$MPC_loaded !== true ? (window.attachEvent ? 
            window.attachEvent('onload', $MPC_load) : 
            window.addEventListener('load', $MPC_load, false)) : null;
    })();
    
    // Callback quando pagamento finaliza
    function $MPC_message(event) {
        if (event.data && event.data.preapproval_id) {
            processSubscriptionPayment(event.data.preapproval_id);
        }
    }
    window.addEventListener("message", $MPC_message);
</script>
```

---

## 🚀 **Como Funciona**

### **1. Usuário Escolhe Plano Mensal**
Na página `auth.html` ou `auth_new.html`:
- Clica em "Plano Mensal - R$ 25,00/mês"
- Preenche dados de cadastro
- É redirecionado para `payment.html`

### **2. Página de Pagamento**
No `payment.html`:
- **Se plano = mensal:** Mostra botão Mercado Pago + PIX
- **Se plano = ilimitado:** Mostra apenas PIX

### **3. Pagamento Mercado Pago**
Quando usuário clica no botão:
1. Abre página segura do Mercado Pago
2. Usuário escolhe método de pagamento
3. Realiza o pagamento
4. Mercado Pago processa
5. Retorna para o site com `preapproval_id`

### **4. Ativação Automática**
Quando retorna:
```javascript
function $MPC_message(event) {
    // Recebe preapproval_id do Mercado Pago
    processSubscriptionPayment(event.data.preapproval_id);
}

async function processSubscriptionPayment(preapprovalId) {
    // 1. Cria usuário no banco
    // 2. Ativa assinatura por 30 dias
    // 3. Faz auto-login
    // 4. Redireciona para o bot
}
```

---

## 📊 **Dados Salvos do Usuário**

Quando paga via Mercado Pago, salva:

```javascript
{
    username: "usuario123",
    email: "usuario@email.com",
    subscriptionType: "monthly",
    expiryDate: "2025-11-19T...", // +30 dias
    metadata: {
        source: "mercado-pago",
        plan: "monthly",
        price: 25.00,
        preapprovalId: "abc123...", // ID único da assinatura MP
        paymentMethod: "mercado-pago-subscription"
    }
}
```

---

## 🎨 **Interface**

### **Botão Mercado Pago**
Aparece **apenas para Plano Mensal**:

```
╔══════════════════════════════════════╗
║  💳 Pague com Mercado Pago           ║
║  Assinatura recorrente automática    ║
║  R$ 25,00/mês                        ║
║                                      ║
║  [💳 Assinar com Mercado Pago]      ║
╚══════════════════════════════════════╝
            ou
╔══════════════════════════════════════╗
║  📱 Pague com PIX                    ║
║  [QR Code]                           ║
║  [Copiar código PIX]                 ║
╚══════════════════════════════════════╝
```

---

## ✅ **Vantagens da Integração**

### **Para o Usuário:**
- ✅ Não precisa renovar manualmente todo mês
- ✅ Pagamento automático seguro
- ✅ Múltiplas formas de pagamento (cartão, PIX, boleto)
- ✅ Gerenciamento fácil no app Mercado Pago
- ✅ Pode cancelar a qualquer momento

### **Para o Negócio:**
- ✅ Recebimento automático recorrente
- ✅ Menos inadimplência (renovação automática)
- ✅ Relatórios completos no painel Mercado Pago
- ✅ Segurança e compliance garantidos pelo MP
- ✅ Split de pagamento (se necessário)

### **Para o Sistema:**
- ✅ Integração simples (apenas botão + callback)
- ✅ Mercado Pago gerencia cobrança recorrente
- ✅ Webhook para notificações (pode implementar depois)
- ✅ Não precisa lidar com dados de cartão

---

## 🔒 **Segurança**

### **O que o Mercado Pago faz:**
- ✅ Processa pagamentos de forma segura (PCI compliant)
- ✅ Gerencia dados sensíveis (cartões, contas bancárias)
- ✅ Protege contra fraudes
- ✅ Emite notas fiscais (se configurado)

### **O que o Champion Bot faz:**
- ✅ Apenas recebe confirmação de pagamento (`preapproval_id`)
- ✅ Nunca vê dados de cartão ou bancários
- ✅ Ativa conta do usuário após confirmação
- ✅ Armazena apenas ID da assinatura

---

## 📈 **Próximos Passos (Opcional)**

### **Webhooks do Mercado Pago:**
Para ser notificado automaticamente de eventos:

```javascript
// Eventos que o MP pode enviar:
- payment.created    // Pagamento criado
- payment.updated    // Status atualizado
- payment.approved   // Pagamento aprovado
- payment.rejected   // Pagamento rejeitado
- subscription.created     // Assinatura criada
- subscription.cancelled   // Assinatura cancelada
- subscription.paused      // Assinatura pausada
```

**Implementação futura:**
1. Criar endpoint no backend: `https://seusite.com/webhook/mercadopago`
2. Configurar no painel do Mercado Pago
3. Validar assinatura da requisição
4. Processar eventos automaticamente

### **Renovação Automática:**
- O Mercado Pago cobra automaticamente todo mês
- Você pode criar uma rotina para:
  1. Verificar status da assinatura via API MP
  2. Renovar `expiryDate` do usuário automaticamente
  3. Enviar notificação de renovação

### **Cancelamento:**
- Usuário pode cancelar no app Mercado Pago
- Você pode criar botão "Cancelar Assinatura" que:
  1. Chama API do MP para cancelar
  2. Desativa conta ao fim do período pago

---

## 🛠️ **Testando a Integração**

### **1. Teste Modo Sandbox (Mercado Pago)**
```
1. Acesse: https://www.mercadopago.com.br/developers
2. Ative o modo teste
3. Use cartões de teste:
   - Aprovado: 5031 4332 1540 6351
   - Recusado: 5031 7557 3453 0604
```

### **2. Teste no Site**
```
1. Vá para auth.html
2. Clique em "Plano Mensal"
3. Preencha cadastro
4. Clique em "Assinar com Mercado Pago"
5. Faça pagamento de teste
6. Verifique se conta é criada automaticamente
```

---

## 💡 **Dicas**

- ✅ **Sempre teste em sandbox antes de produção**
- ✅ **Configure webhooks para renovações automáticas**
- ✅ **Monitore o painel do Mercado Pago regularmente**
- ✅ **Mantenha o `preapproval_id` salvo (rastreamento)**
- ✅ **Ofereça suporte para dúvidas sobre assinatura**

---

## 📞 **Suporte**

### **Problemas Comuns:**

**"Botão não aparece"**
- Verifique se escolheu Plano Mensal
- Abra Console (F12) e veja erros
- Recarregue a página

**"Pagamento não processa"**
- Verifique internet
- Tente outro método no MP
- Veja se o plano está ativo no painel MP

**"Conta não é criada após pagamento"**
- Verifique Console (F12)
- Veja se callback `$MPC_message` foi chamado
- Confirme se `preapproval_id` foi recebido

---

## ✅ **Status da Integração**

- [x] ✅ Botão Mercado Pago adicionado
- [x] ✅ Script oficial MP integrado
- [x] ✅ Callback de retorno implementado
- [x] ✅ Criação automática de conta
- [x] ✅ Auto-login após pagamento
- [x] ✅ Exibição apenas no Plano Mensal
- [x] ✅ Estilo premium aplicado
- [ ] ⏳ Webhooks (futuro)
- [ ] ⏳ Renovação automática (futuro)
- [ ] ⏳ Cancelamento via site (futuro)

---

**🎉 Mercado Pago integrado com sucesso!**

*Última atualização: 19 de outubro de 2025*
*Plano de Assinatura ID: cde77946d7624bc6aaf5805e635af5fe*
*Valor: R$ 25,00/mês (recorrente)*
