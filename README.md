# Provas — Frontend de Gestão Escolar

Frontend React + TypeScript + Vite para o Sistema de Gestão de Provas Escolares, integrado exclusivamente à API Node.js/Express existente.

## Requisitos

- Node.js 20 ou superior recomendado
- API Express em execução e com CORS permitindo a origem do frontend

## Como executar

1. Extraia o ZIP e entre na pasta `provas-frontend`.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Copie `.env.example` para `.env` e configure a URL base da sua API:

   ```env
   VITE_API_URL=http://localhost:3000
   ```

   Ajuste a porta conforme a porta real do seu backend. Não coloque credenciais nem chaves do Supabase neste arquivo.

4. Inicie o frontend:

   ```bash
   npm run dev
   ```

5. Abra a URL mostrada pelo Vite, normalmente `http://localhost:5173`.

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Funcionalidades

- Login por `POST /sessions`, com token JWT salvo em `localStorage`.
- Cabeçalho `Authorization: Bearer <token>` automático nas chamadas autenticadas.
- Logout automático quando uma chamada privada responde `401`.
- Dashboard com resumo de provas e turmas.
- Turmas: listagem por perfil; coordenador pode criar, editar, excluir e gerenciar professores vinculados.
- Provas: listagem, pesquisa e filtro de status; detalhes via `GET /provas/:id`; visualização/download pelo `arquivo_url`; exclusão com confirmação.
- Professor pode enviar prova com `multipart/form-data`, usando o nome exato do campo de arquivo `arquivo`, limite de 3 MB e extensões JPG, PNG, PDF, DOC e DOCX.
- Validação de formulários com React Hook Form + Zod; mensagens via Sonner.
- Layout responsivo para desktop e celular.

## Endpoints utilizados

Somente os endpoints informados na especificação:

- `POST /sessions`
- `GET /users/professores`
- `GET /turmas`, `GET /turmas/:id`, `POST /turmas`, `PUT /turmas/:id`, `DELETE /turmas/:id`
- `POST /turmas/:turmaId/professores`, `DELETE /turmas/:turmaId/professores/:professorId`
- `GET /provas`, `GET /provas/:id`, `POST /provas`, `DELETE /provas/:id`

O frontend não consulta o banco de dados e não acessa o Supabase diretamente.

## Observações de integração

- O projeto usa Vite; por isso, a variável pública se chama `VITE_API_URL` (o equivalente a `NEXT_PUBLIC_API_URL` em projetos Next.js).
- A API deve devolver os campos descritos na especificação. Em especial, a listagem de provas deve incluir `turma.nome`, `professor.name` e `arquivo_url` para exibir todas as informações e ações.
- O frontend não cria escolas nem adiciona campos ao formulário de prova que não estejam definidos na especificação.
- A permissão real continua sendo responsabilidade do backend. A interface oculta ações conforme `user.role`, mas isso não substitui os middlewares e as verificações de autorização da API.
- Para que login e chamadas funcionem, confira se o CORS do backend permite a origem local do Vite.
