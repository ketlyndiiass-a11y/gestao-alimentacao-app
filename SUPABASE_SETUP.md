# Guia de configuracao do Supabase

Este guia e o passo a passo para ligar o aplicativo ao Supabase.

## 1. Criar o projeto

1. Acesse `https://supabase.com`.
2. Entre na sua conta ou crie uma conta.
3. Clique em `New project`.
4. Escolha a organizacao.
5. Preencha:
   - Nome do projeto: `gestao-alimentacao`
   - Senha do banco: guarde em local seguro
   - Regiao: escolha a mais proxima do Brasil, se estiver disponivel
6. Clique para criar o projeto.
7. Aguarde o Supabase finalizar a criacao.

## 2. Pegar URL e chave publica

1. Dentro do projeto Supabase, abra `Project Settings`.
2. Entre em `API`.
3. Copie:
   - `Project URL`
   - `anon public key`

Esses valores entram no arquivo `.env.local` do projeto.

## 3. Criar o arquivo `.env.local`

Na raiz do projeto, crie um arquivo chamado `.env.local`.

Use este modelo:

```env
NEXT_PUBLIC_SUPABASE_URL=cole_a_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=cole_a_anon_public_key_aqui
```

Nao coloque a `service_role key` no frontend. Ela so deve ser usada em servidor/webhooks.

## 4. Criar as tabelas do banco

1. No Supabase, abra `SQL Editor`.
2. Clique para criar uma nova query.
3. Copie todo o conteudo do arquivo:

```txt
supabase/schema.sql
```

4. Cole no SQL Editor.
5. Execute a query.

Esse SQL cria:

- planos;
- perfis de usuario;
- assinaturas;
- lojas;
- entradas e saidas;
- contas;
- produtos precificados;
- ingredientes;
- metas mensais;
- configuracoes;
- sessoes de dispositivos;
- regras de seguranca para cada usuario ver somente os proprios dados.

## 5. Configurar autenticacao

1. No Supabase, abra `Authentication`.
2. Entre em `Providers`.
3. Confirme que `Email` esta ativo.
4. Por enquanto, podemos usar login por e-mail e senha.

Depois podemos configurar:

- recuperacao de senha;
- convite depois da compra;
- link magico;
- confirmacao de e-mail.

## 6. Regra dos planos

Os planos criados no banco sao:

- Essencial: 1 loja, 2 dispositivos, R$ 29,90/mes.
- Gestao: 2 lojas, 3 dispositivos, R$ 49,90/mes.
- Elite: 3 lojas, 5 dispositivos, R$ 79,90/mes.

O banco ja tem uma protecao para impedir que o usuario crie mais lojas do que o plano permite.

## 7. Regra dos 45 dias

A tabela `subscriptions` tem o campo:

```txt
data_retention_until
```

Ele serve para guardar ate quando os dados devem ficar preservados apos atraso ou cancelamento.

Exemplo:

- assinatura ativa: acesso normal;
- assinatura atrasada/cancelada: dados preservados ate 45 dias;
- passou de 45 dias: podemos bloquear de vez, arquivar ou apagar futuramente.

## 8. Depois que o Supabase estiver pronto

Com o Supabase configurado, os proximos passos no codigo sao:

1. Criar tela de login.
2. Criar protecao para bloquear o app sem login.
3. Trocar localStorage por dados do Supabase.
4. Sincronizar lojas, entradas, saidas, contas, produtos, metas e configuracoes.
5. Criar a liberacao de acesso apos pagamento no checkout.
