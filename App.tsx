import { AppNavigator } from './src/navigation/app-navigator';
import { UserProvider } from './src/providers/user-provider';
import { ChatProvider } from './src/providers/chat-provider';
import { ReviewsProvider } from './src/providers/reviews-provider';
import { ManagementProvider } from './src/providers/management-provider';
import { ThemeProvider } from './src/providers/theme-provider';

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ReviewsProvider>
          <ManagementProvider>
            <ChatProvider>
              <AppNavigator />
            </ChatProvider>
          </ManagementProvider>
        </ReviewsProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
