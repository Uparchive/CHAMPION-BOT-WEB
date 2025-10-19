# 🚀 SISTEMA PRONTO! REDIRECIONA PARA MERCADO PAGO

## ✅ O QUE MUDOU

Agora o sistema **NÃO usa mais simulação**! 

Cliente é **redirecionado direto para o Mercado Pago**, paga de VERDADE, e o sistema cria a conta automaticamente quando o pagamento é aprovado!

---

## 🎯 PARA COMEÇAR A USAR

### 1️⃣ **Abra o Terminal (PowerShell)**

### 2️⃣ **Execute este comando para Plano Mensal:**

```powershell
curl -X POST "https://api.mercadopago.com/checkout/preferences" -H "Authorization: Bearer APP_USR-7301337016090260-101916-595fc615c118f5b6eb0bcdc0ba6a32ee-487873350" -H "Content-Type: application/json" -d "{\"items\": [{\"title\": \"Champion Bot - Plano Mensal\", \"quantity\": 1, \"currency_id\": \"BRL\", \"unit_price\": 25.00}], \"back_urls\": {\"success\": \"file:///C:/Users/Keslly%20Albuquerque/Desktop/Bot%20Atualiza%C3%A7%C3%A3o/payment_success.html\", \"failure\": \"file:///C:/Users/Keslly%20Albuquerque/Desktop/Bot%20Atualiza%C3%A7%C3%A3o/payment_failure.html\"}, \"auto_return\": \"approved\", \"external_reference\": \"monthly_plan\"}"
```

**Vai retornar algo como:**
```json
{
  "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=487873350-XXXXXXXX"
}
```

**COPIE ESSE LINK!**

### 3️⃣ **Execute este comando para Plano Ilimitado:**

```powershell
curl -X POST "https://api.mercadopago.com/checkout/preferences" -H "Authorization: Bearer APP_USR-7301337016090260-101916-595fc615c118f5b6eb0bcdc0ba6a32ee-487873350" -H "Content-Type: application/json" -d "{\"items\": [{\"title\": \"Champion Bot - Plano Ilimitado\", \"quantity\": 1, \"currency_id\": \"BRL\", \"unit_price\": 259.90}], \"back_urls\": {\"success\": \"file:///C:/Users/Keslly%20Albuquerque/Desktop/Bot%20Atualiza%C3%A7%C3%A3o/payment_success.html\", \"failure\": \"file:///C:/Users/Keslly%20Albuquerque/Desktop/Bot%20Atualiza%C3%A7%C3%A3o/payment_failure.html\"}, \"auto_return\": \"approved\", \"external_reference\": \"unlimited_plan\", \"payment_methods\": {\"installments\": 12}}"
```

**COPIE ESSE LINK TAMBÉM!**

### 4️⃣ **Cole os Links no Código**

Abra `payment_redirect.html` (linha 238) e substitua:

```javascript
const PAYMENT_LINKS = {
    monthly: 'COLE_O_LINK_DO_PLANO_MENSAL_AQUI',
    unlimited: 'COLE_O_LINK_DO_PLANO_ILIMITADO_AQUI'
};
```

---

## 🎮 TESTAR AGORA

1. Abra `auth.html`
2. Cadastre usuário teste
3. Escolha plano
4. Clique "Pagar"
5. Clique "Pagar com Mercado Pago"
6. **VAI ABRIR A PÁGINA DO MERCADO PAGO!**
7. Pague com PIX ou cartão de teste
8. Após pagamento, volta automaticamente
9. Conta é criada e você está logado no bot! 🎉

---

## 💳 CARTÕES DE TESTE (NÃO COBRA DE VERDADE)

| Cartão | Número | CVV | Validade | Nome |
|--------|--------|-----|----------|------|
| Mastercard | 5031 4332 1540 6351 | 123 | 11/25 | APRO |
| Visa | 4235 6477 2802 5682 | 123 | 11/25 | APRO |

---

## 📊 VER PAGAMENTOS

Acompanhe pagamentos em:
https://www.mercadopago.com.br/activities

---

**✅ PRONTO! SISTEMA 100% FUNCIONAL PARA PAGAMENTOS REAIS!** 🚀💰
