import { Fragment } from 'react';

import { AppNavigator } from './src/navigation/app-navigator';
import { UserProvider } from './src/providers/user-provider';
import { ChatProvider } from './src/providers/chat-provider';
import { ReviewsProvider } from './src/providers/reviews-provider';
import { ManagementProvider } from './src/providers/management-provider';
import { ThemeProvider } from './src/providers/theme-provider';
import { ApplicationsProvider } from './src/providers/applications-provider';
import { useUser } from './src/providers/user-provider';

function SessionProviders() {
  const { user } = useUser();

  // Cada identidade recebe uma árvore nova de caches em memória. Trocar de
  // conta desmonta conversas, candidaturas e avaliações da conta anterior
  // antes de renderizar a sessão seguinte.
  return (
    <Fragment key={user?.usuarioId ?? 'anonymous'}>
      <ReviewsProvider>
        <ManagementProvider>
          <ChatProvider>
            <ApplicationsProvider>
              <AppNavigator />
            </ApplicationsProvider>
          </ChatProvider>
        </ManagementProvider>
      </ReviewsProvider>
    </Fragment>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <SessionProviders />
      </UserProvider>
    </ThemeProvider>
  );
}
