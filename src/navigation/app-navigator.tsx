import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';

import CreatePortfolioScreen from '@/features/auth/screens/create-portfolio-screen';
import CustomizeProfileScreen from '@/features/auth/screens/customize-profile-screen';
import LoginScreen from '@/features/auth/screens/login-screen';
import RegisterScreen from '@/features/auth/screens/register-screen';
import ChatConversationScreen from '@/features/chat/screens/chat-conversation-screen';
import ChatListScreen from '@/features/chat/screens/chat-list-screen';
import EventDetailsScreen from '@/features/events/screens/event-details-screen';
import CreateEventScreen from '@/features/events/screens/create-event-screen';
import EditEventScreen from '@/features/events/screens/edit-event-screen';
import EventAlbumScreen from '@/features/events/screens/event-album-screen';
import EventsScreen from '@/features/events/screens/events-screen';
import { MapScreen } from '@/features/map/screens/map-screen';
import CreateOpportunityScreen from '@/features/opportunities/screens/create-opportunity-screen';
import EditOpportunityScreen from '@/features/opportunities/screens/edit-opportunity-screen';
import ManageOpportunitiesScreen from '@/features/opportunities/screens/manage-opportunities-screen';
import OpportunitiesScreen from '@/features/opportunities/screens/opportunities-screen';
import OpportunityDetailsScreen from '@/features/opportunities/screens/opportunity-details-screen';
import EditOpportunityContractorProfileScreen from '@/features/profile/screens/edit-opportunity-contractor-profile-screen';
import EditContractorProfileScreen from '@/features/profile/screens/edit-contractor-profile-screen';
import EditProfileScreen from '@/features/profile/screens/edit-profile-screen';
import SelectLocationScreen from '@/features/profile/screens/select-location-screen';
import PortfolioCreationScreen from '@/features/profile/screens/portfolio-creation-screen';
import ProfileScreen from '@/features/profile/screens/profile-screen';
import PublicProfileScreen from '@/features/profile/screens/public-profile-screen';
import SettingsScreen from '@/features/profile/screens/settings-screen';
import { FeedbackState, ScreenContainer } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser } from '@/providers/user-provider';

export type RootStackParamList={
 Map:undefined; Login:undefined; Register:undefined; CreatePortfolio:undefined; CustomizeProfile:undefined; Tabs:NavigatorScreenParams<TabParamList> | undefined;
 EditProfile?:{agente?:unknown; localSelecionado?:{latitude:number;longitude:number;endereco:string;cidade:string}}; SelectLocation:{latitude?:number|null;longitude?:number|null}; EditContractorProfile:undefined; EditOpportunityContractorProfile:{mode?:'presentation'}|undefined; CreateOpportunity:undefined; EditOpportunity:{opportunityId:string}; PortfolioCreation?:{portfolio?:unknown[];mode?:'manage'|'add'|'edit';itemId?:string};
 Settings:undefined; ChatConversation:{conversationId:string}; ManageOpportunities:undefined;
 OpportunityDetails:{opportunityId:string}; PublicProfile:{profileType:'AGENTE'|'CONTRATANTE';profileId:string}; EventDetails:{eventId:string}; CreateEvent:undefined; EditEvent:{eventId:string}; EventAlbum:{eventId:string};
};

export type TabParamList={Map:undefined;Profile:undefined;Opportunities:undefined;Events:undefined;Chat:undefined};

const Stack=createNativeStackNavigator<RootStackParamList>();
const Tab=createBottomTabNavigator<TabParamList>();

const icons:Record<keyof TabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
 Map:{active:'map',inactive:'map-outline'},
 Profile:{active:'person',inactive:'person-outline'},
 Opportunities:{active:'briefcase',inactive:'briefcase-outline'},
 Events:{active:'calendar',inactive:'calendar-outline'},
 Chat:{active:'chatbubble-ellipses',inactive:'chatbubble-ellipses-outline'},
};

function AppTabs(){
 const {color,spacing,dimensions,radius,typography}=useThemeTokens();
 return <Tab.Navigator initialRouteName="Map" backBehavior="history" screenOptions={({route})=>({
  headerShown:false,
  tabBarActiveTintColor:color.accentOnInverse,
  tabBarInactiveTintColor:color.textInverse,
  tabBarLabelStyle:{fontSize:typography.size.caption,fontWeight:'700'},
  tabBarLabelPosition:'below-icon',
  tabBarAllowFontScaling:true,
  // Sem altura fixa: React Navigation incorpora os insets do dispositivo.
  tabBarStyle:{borderTopWidth:1,borderTopColor:color.border,backgroundColor:color.textPrimary,elevation:0},
  tabBarHideOnKeyboard:true,
  tabBarIcon:({color:foreground,focused})=>(
   <View style={{
    minWidth:dimensions.touchTarget, minHeight:dimensions.icon.extraLarge, paddingHorizontal:spacing.sm,
    alignItems:'center',justifyContent:'center', borderRadius:radius.control,
    backgroundColor:focused?color.accentSoft:'transparent',
   }}>
    <Ionicons name={focused?icons[route.name].active:icons[route.name].inactive} size={dimensions.icon.medium} color={focused?color.textPrimary:foreground}/>
   </View>
  )
 })}>
  <Tab.Screen name="Map" component={MapScreen} options={{title:'Mapa'}}/>
  <Tab.Screen name="Opportunities" component={OpportunitiesScreen} options={{title:'Vagas',tabBarAccessibilityLabel:'Oportunidades'}}/>
  <Tab.Screen name="Events" component={EventsScreen} options={{title:'Agenda',tabBarAccessibilityLabel:'Agenda de eventos'}}/>
  <Tab.Screen name="Chat" component={ChatListScreen} options={{title:'Chat'}}/>
  <Tab.Screen name="Profile" component={ProfileScreen} options={{title:'Perfil'}}/>
 </Tab.Navigator>;
}

function RootStack(){
 const{user,loading,needsOnboarding}=useUser();
 if(loading)return <ScreenContainer style={{justifyContent:'center'}}><FeedbackState kind="loading" title="Abrindo Arthere…"/></ScreenContainer>;
 return <Stack.Navigator screenOptions={{headerShown:false}}>
  {!user ? (
    <>
      <Stack.Screen name="Map" component={MapScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="Register" component={RegisterScreen}/>
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen}/>
      <Stack.Screen name="OpportunityDetails" component={OpportunityDetailsScreen}/>
      <Stack.Screen name="EventDetails" component={EventDetailsScreen}/>
    </>
  ) : needsOnboarding ? (
    user.tipo === 'AGENTE'
      ? <Stack.Screen name="CreatePortfolio" component={CreatePortfolioScreen}/>
      : <Stack.Screen name="CustomizeProfile" component={CustomizeProfileScreen}/>
  ) : (
    <>
      <Stack.Screen name="Tabs" component={AppTabs}/>
      <Stack.Screen name="EditProfile" component={EditProfileScreen}/>
      <Stack.Screen name="SelectLocation" component={SelectLocationScreen}/>
      {user.tipo === 'CONTRATANTE_OPORTUNIDADES' ? <>
        <Stack.Screen name="EditOpportunityContractorProfile" component={EditOpportunityContractorProfileScreen}/>
        <Stack.Screen name="CreateOpportunity" component={CreateOpportunityScreen}/>
        <Stack.Screen name="EditOpportunity" component={EditOpportunityScreen}/>
      </> : null}
      <Stack.Screen name="PortfolioCreation" component={PortfolioCreationScreen}/>
      <Stack.Screen name="Settings" component={SettingsScreen}/>
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen}/>
      {user.tipo === 'AGENTE' || user.tipo === 'CONTRATANTE_OPORTUNIDADES' ? (
        <Stack.Screen name="ManageOpportunities" component={ManageOpportunitiesScreen}/>
      ) : null}
      <Stack.Screen name="OpportunityDetails" component={OpportunityDetailsScreen}/>
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen}/>
      <Stack.Screen name="EventDetails" component={EventDetailsScreen}/>
      {user.tipo === 'CONTRATANTE_EVENTOS' ? <>
        <Stack.Screen name="EditContractorProfile" component={EditContractorProfileScreen}/>
        <Stack.Screen name="CreateEvent" component={CreateEventScreen}/>
        <Stack.Screen name="EditEvent" component={EditEventScreen}/>
        <Stack.Screen name="EventAlbum" component={EventAlbumScreen}/>
      </> : null}
    </>
  )}
 </Stack.Navigator>;
}

export function AppNavigator(){
 const {color}=useThemeTokens();
 const navigationTheme=useMemo(()=>({
  ...DefaultTheme,
  colors:{...DefaultTheme.colors,primary:color.accentText,background:color.background,card:color.surface,text:color.textPrimary,border:color.border,notification:color.dangerText},
 }),[color]);
 return <NavigationContainer theme={navigationTheme}><RootStack/></NavigationContainer>;
}
