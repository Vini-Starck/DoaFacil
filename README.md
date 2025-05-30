# DoaFácil

Aplicativo web de doações colaborativas, desenvolvido em React e Firebase, permitindo que usuários ofereçam e solicitem itens de forma simples e segura.

---

## 📦 Versões das Dependências

As versões utilizadas no `package.json` (v0.1.0) foram:

| Biblioteca                                 | Versão    |



| react                                      | ^18.3.1   |

| react-dom                                  | ^18.3.1   |

| react-scripts                              | 5.0.1     |

| @mui/material                              | ^6.4.7    |

| @emotion/react, @emotion/styled            | ^11.14.0  |

| react-router-dom                           | ^7.3.0    |

| firebase                                   | ^11.4.0   |

| abacatepay-nodejs-sdk                      | ^1.3.1    |

| @react-google-maps/api                     | ^2.20.6   |

| react-google-places-autocomplete           | ^4.1.0    |

| react-icons                                | ^5.5.0    |

| @testing-library/react, jest-dom, user-event, dom | ^16.2.0, ^6.6.3, ^13.5.0, ^10.4.0 |

| web-vitals                                 | ^2.1.4    |

---

## 🚀 Scripts NPM

```bash
# inicia em modo desenvolvimento (Hot-Reload)
npm start

# gera a build otimizada
npm run build

# executa testes
npm test

# “eject” — expõe configurações do Create React App
npm run eject

```

# 🛠️ Pré-requisitos
Node.js v18.x ou superior

npm v9.x ou superior

Conta Google / Firebase CLI instalado (npm install -g firebase-tools)

# 🔧 Instalação & Configuração

Clone o repositório

```bash
git clone https://github.com/seu-usuario/doafacil.git
cd doafacil
```


Instale dependências

```bash
npm install
```

Configurar Firebase

 - Crie um projeto no Firebase Console.

 - Habilite Authentication (Email/Senha e Google).

 - Configure Cloud Firestore em modo test (após dev, migre para locked).

 - Habilite Storage para imagens de perfil e itens.

 - Copie as credenciais (API key, Auth domain, etc.) no arquivo src/config/firebase.js:

 ```bash
// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

Inicialize Firebase no projeto

```bash
firebase login
firebase init
```

# 📂 Script de Criação do Banco (Firestore)

O Cloud Firestore é “schema-less”, mas você pode definir regras de segurança e índices em:

 - Regras de segurança (firestore.rules)

 - Definição de índices (firestore.indexes.json)

Exemplo básico de firestore.rules:

```bash
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários autenticados podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, update: if request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    // Tickets de suporte
    match /supportTickets/{ticketId} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == resource.data.userId;
    }
    // Outros caminhos...
  }
}
```

E um exemplo de firestore.indexes.json para consultas compostas:

```bash
{
  "indexes": [
    {
      "collectionGroup": "avaliations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toUser", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Para implantar regras e índices:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

# ☁️ Deploy (Hosting)

Build:

```bash
npm run build
```

Deploy no Firebase Hosting:
```bash
firebase deploy --only hosting
```

O site ficará disponível em https://<seu-projeto>.web.app

# 🔗 Tecnologias e Ferramentas

 - React 18.3.1

 - Material-UI (MUI) 6.4.7

 - Firebase (Auth, Firestore v11.4.0, Storage)

 - AbacatePay-SDK 1.3.1

 - GoogleMaps para mapas

 - React Router v7

 # 🤝 Contribuição

1. Fork do projeto

2. Crie sua branch: git checkout -b feature/nome-da-feature

3. Commit suas alterações: git commit -m 'Adiciona nova feature'

4. Push para sua branch: git push origin feature/nome-da-feature

5. Abra um Pull Request


# Obrigado!