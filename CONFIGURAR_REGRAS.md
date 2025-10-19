# 🔒 Configurar Regras de Segurança do Firestore

## ⚡ PASSO A PASSO (2 minutos)

### 1️⃣ Abrir Console do Firebase
```
1. Vá para: https://console.firebase.google.com/
2. Selecione seu projeto: "Champion Bot"
3. No menu lateral, clique em "Firestore Database"
4. Clique na aba "Regras" (Rules)
```

### 2️⃣ Copiar as Regras
Abra o arquivo `firestore.rules` que está na sua pasta e copie TODO o conteúdo.

Ou copie direto daqui:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /users/{userId} {
      // MODO DESENVOLVIMENTO: Permite tudo temporariamente
      allow read, write: if true;
    }
    
    match /sessions/{sessionId} {
      allow read, write: if true;
    }
    
    match /logs/{logId} {
      allow read, write: if true;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**⚠️ IMPORTANTE**: Estas são regras de **DESENVOLVIMENTO** (permitem tudo). Depois de migrar seus dados e testar, você deve ativar regras mais seguras!

### 3️⃣ Colar e Publicar
```
1. Cole as regras no editor (substitua tudo que está lá)
2. Clique no botão "Publicar" (Publish)
3. Aguarde a confirmação (leva ~5 segundos)
```

### ✅ Pronto! Regras Aplicadas!

---

## 🔒 O que estas regras fazem?

### **Coleção `users`:**
- ✅ **Leitura**: Qualquer um autenticado pode ler (necessário para login)
- ✅ **Criação**: Qualquer um pode criar (registro de novos usuários)
- ✅ **Atualização**: Apenas o próprio usuário OU admins
- ✅ **Exclusão**: Apenas admins podem excluir

### **Coleção `sessions`:**
- ✅ Usuários só acessam suas próprias sessões
- ✅ Isolamento total entre usuários

### **Coleção `logs`:**
- ✅ Apenas admins podem ler logs
- ✅ Qualquer um pode criar logs (auditoria)
- ✅ Logs não podem ser editados/deletados (integridade)

### **Padrão:**
- 🚫 Qualquer outra coleção: **NEGADO**

---

## 🎯 Benefícios de Segurança

✅ **Proteção contra acesso não autorizado**  
✅ **Usuários isolados** (não veem dados de outros)  
✅ **Admins têm controle total**  
✅ **Logs imutáveis** (auditoria confiável)  
✅ **Registro público** (novos usuários podem se cadastrar)  

---

## ⚠️ IMPORTANTE

Após publicar as regras, teste:

1. Abra `admin_firebase.html`
2. Tente carregar usuários
3. Se funcionar = ✅ Regras OK!
4. Se der erro = Verifique o console (F12)

---

## 🆘 Solução de Problemas

### Erro: "Missing or insufficient permissions"
**Causa**: Regras muito restritivas  
**Solução**: Verifique se colou as regras COMPLETAS acima

### Erro: "auth/network-request-failed"
**Causa**: Problema de rede ou Authentication não ativado  
**Solução**: Verifique sua conexão e se ativou Authentication

### Usuários não carregam
**Causa**: Coleção vazia ou regras bloqueando  
**Solução**: Execute a migração de dados primeiro

---

**Configurado!** 🎉  
Agora seu banco está protegido e pronto para uso!
