# Configuracao do webhook Kiwify

## Rota do aplicativo

Depois de publicar o app, cadastre esta URL na Kiwify:

```text
https://SEU-DOMINIO.com/api/webhooks/kiwify
```

Localmente, essa rota existe em:

```text
http://127.0.0.1:3000/api/webhooks/kiwify
```

## Eventos que devem ser ativados na Kiwify

Ative estes eventos:

- compra_aprovada
- compra_recusada
- compra_reembolsada
- chargeback
- subscription_canceled
- subscription_late
- subscription_renewed

## Variaveis de ambiente obrigatorias

No servidor de producao, configure:

```env
SUPABASE_SERVICE_ROLE_KEY=
KIWIFY_WEBHOOK_TOKEN=
```

O `SUPABASE_SERVICE_ROLE_KEY` vem do Supabase e deve ficar somente no servidor.
Nunca coloque essa chave no navegador.

## Mapeamento dos planos

Quando criar os planos na Kiwify, preencha pelo menos um identificador por plano:

```env
KIWIFY_ESSENTIAL_PLAN_ID=
KIWIFY_ESSENTIAL_PRODUCT_ID=
KIWIFY_ESSENTIAL_CHECKOUT_LINK=

KIWIFY_MANAGEMENT_PLAN_ID=
KIWIFY_MANAGEMENT_PRODUCT_ID=
KIWIFY_MANAGEMENT_CHECKOUT_LINK=

KIWIFY_ELITE_PLAN_ID=
KIWIFY_ELITE_PRODUCT_ID=
KIWIFY_ELITE_CHECKOUT_LINK=
```

Se os nomes dos planos na Kiwify forem "Essencial", "Gestao" e "Elite", o webhook tambem consegue identificar pelo nome.

## O que o webhook faz

- Compra aprovada ou assinatura renovada: marca assinatura como `active`.
- Assinatura atrasada: marca como `past_due` e preserva os dados por 45 dias.
- Cancelamento, reembolso ou chargeback: marca como `canceled` e preserva os dados por 45 dias.
- Upgrade ou troca de plano: atualiza `plan_code` para `essential`, `management` ou `elite`.

## Observacao

Segundo a documentacao da Kiwify, os webhooks sao enviados em JSON e o sistema deve responder com status `2xx` para confirmar recebimento.
