# API de Gerenciamento de Usuários

API RESTful para gerenciamento de usuários com controle de acesso baseado em funções (RBAC).

## Tecnologias Utilizadas

- NestJS
- TypeScript
- PostgreSQL
- JWT para autenticação
- Swagger para documentação

## Configuração do Ambiente

1. Instale as dependências:
```bash
npm install
```

2. Configure um banco de dados postgress:
```
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'postgres',
```

4. Inicie o servidor:
```bash
npm start
```

A API estará disponível em `http://localhost:3001`

## Documentação Swagger

A documentação interativa da API está disponível em `http://localhost:3001/api`

## Endpoints

### Autenticação

#### POST /auth/login
Autentica um usuário e retorna um token JWT.

**Request Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "role": "admin"
  }
}
```

### Usuários

#### POST /users
Cria um novo usuário.

**Request Body:**
```json
{
  "name": "Nome do Usuário",
  "email": "usuario@email.com",
  "password": "senha123",
  "role": "admin" // admin, manager ou user
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "role": "admin",
    "createdAt": "2024-03-10T12:00:00Z",
    "updatedAt": "2024-03-10T12:00:00Z"
  }
}
```

#### GET /users
Lista todos os usuários (requer autenticação e permissão de leitura).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "role": "admin",
    "createdAt": "2024-03-10T12:00:00Z",
    "updatedAt": "2024-03-10T12:00:00Z"
  }
]
```

#### GET /users/:id
Busca um usuário específico (requer autenticação e permissão de leitura).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Nome do Usuário",
  "email": "usuario@email.com",
  "role": "admin",
  "createdAt": "2024-03-10T12:00:00Z",
  "updatedAt": "2024-03-10T12:00:00Z"
}
```

#### PATCH /users/:id
Atualiza um usuário (requer autenticação e permissão de atualização).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com",
  "password": "novasenha",
  "role": "manager"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Novo Nome",
  "email": "novo@email.com",
  "role": "manager",
  "createdAt": "2024-03-10T12:00:00Z",
  "updatedAt": "2024-03-10T12:00:00Z"
}
```

#### DELETE /users/:id
Remove um usuário (requer autenticação e permissão de exclusão).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Usuário removido com sucesso"
}
```

## Controle de Acesso (RBAC)

A API implementa um sistema de controle de acesso baseado em funções com três níveis:

1. **Admin**
   - Acesso total a todas as operações
   - Pode gerenciar todos os usuários
   - Pode alterar funções de outros usuários

2. **Manager**
   - Pode ler e atualizar usuários
   - Não pode alterar funções
   - Não pode excluir usuários

3. **User**
   - Acesso apenas leitura
   - Pode ver informações básicas
   - Não pode modificar dados

## Tratamento de Erros

A API retorna respostas padronizadas para erros:

```json
{
  "success": false,
  "message": "Mensagem de erro",
  "errors": ["Detalhes do erro"]
}
```

Códigos de status HTTP comuns:
- 200: Sucesso
- 201: Criado
- 400: Requisição inválida
- 401: Não autorizado
- 403: Proibido
- 404: Não encontrado
- 500: Erro interno do servidor

## Segurança

- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Proteção contra CSRF
- Validação de dados de entrada
- Sanitização de dados
- Rate limiting
- Headers de segurança
