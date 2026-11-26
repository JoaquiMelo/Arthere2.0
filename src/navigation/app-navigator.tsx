import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import CreatePortfolioScreen from '@/features/auth/screens/create-portfolio-screen';
import CustomizeProfileScreen from '@/features/auth/screens/customize-profile-screen';
import LoginScreen from '@/features/auth/screens/login-screen';
import RegisterScreen from '@/features/auth/screens/register-screen';
import ChatConversationScreen from '@/features/chat/screens/chat-conversation-screen';
import ChatListScreen from '@/features/chat/screens/chat-list-screen';
import EventDetailsScreen from '@/features/events/screens/event-details-screen';
import CreateEventScreen from '@/features/events/screens/create-event-screen';
import EventsScreen from '@/features/events/screens/events-screen';
import { MapScreen } from '@/features/map/screens/map-screen';
import ManageOpportunitiesScreen from '@/features/opportunities/screens/manage-opportunities-screen';
import OpportunitiesScreen from '@/features/opportunities/screens/opportunities-screen';
import OpportunityDetailsScreen from '@/features/opportunities/screens/opportunity-details-screen';
import EditContractorProfileScreen from '@/features/profile/screens/edit-contractor-profile-screen';
import EditProfileScreen from '@/features/profile/screens/edit-profile-screen';
import SelectLocationScreen from '@/features/profile/screens/select-location-screen';
import PortfolioCreationScreen from '@/features/profile/screens/portfolio-creation-screen';
import ProfileScreen from '@/features/profile/screens/profile-screen';
import PublicProfileScreen from '@/features/profile/screens/public-profile-screen';
import SettingsScreen from '@/features/profile/screens/settings-screen';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser } from '@/providers/user-provider';

export type RootStackParamList={
 Map:undefined; Login:undefined; Register:undefined; CreatePortfolio:undefined; CustomizeProfile:undefined; Tabs:undefined;
 EditProfile?:{agente?:unknown; localSelecionado?:{latitude:number;longitude:number;endereco:string;cidade:string}}; SelectLocation:{latitude?:number|null;longitude?:number|null}; EditContractorProfile:undefined; PortfolioCreation?:{portfolio?:unknown[]};
 Settings:undefined; ChatConversation:{conversationId:string}; ManageOpportunities:undefined;
 Opportunities:undefined; OpportunityDetails:{opportunityId:string}; PublicProfile:{profileType:'AGENTE'|'CONTRATANTE';profileId:string}; Events:undefined; EventDetails:{eventId:string}; CreateEvent:undefined;
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
 const {color,spacing}=useThemeTokens();
 return <Tab.Navigator initialRouteName="Map" screenOptions={({route})=>({
  headerShown:false,
  tabBarActiveTintColor:color.accentOnInverse,
  tabBarInactiveTintColor:color.textInverse,
  tabBarLabelStyle:{fontSize:10,fontWeight:'600'},
  // Sem altura fixa: React Navigation incorpora os insets do dispositivo.
  tabBarStyle:{borderTopWidth:1,borderTopColor:color.border,backgroundColor:color.textPrimary,elevation:0},
  tabBarHideOnKeyboard:true,
  tabBarIcon:({color:foreground,focused})=>(
   <View style={{minWidth:44,height:30,paddingHorizontal:spacing.xs,alignItems:'center',justifyContent:'center'}}>
    <Ionicons name={focused?icons[route.name].active:icons[route.name].inactive} size={22} color={foreground}/>
   </View>
  )
 })}>
  <Tab.Screen name="Map" component={MapScreen} options={{title:'Mapa'}}/>
  <Tab.Screen name="Profile" component={ProfileScreen} options={{title:'Perfil'}}/>
  <Tab.Screen name="Opportunities" component={OpportunitiesScreen} options={{title:'Oportunidades'}}/>
  <Tab.Screen name="Events" component={EventsScreen} options={{title:'Eventos'}}/>
  <Tab.Screen name="Chat" component={ChatListScreen} options={{title:'Chat'}}/>
 </Tab.Navigator>;
}

function RootStack(){
 const{user,loading}=useUser();
 const tokens=useThemeTokens();
 if(loading)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:tokens.color.background}}><ActivityIndicator color={tokens.color.accentText}/></View>;
 return <Stack.Navigator initialRouteName={user?'Tabs':'Map'} screenOptions={{headerShown:false}}>
  {!user ? (
    <>
      <Stack.Screen name="Map" component={MapScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="Register" component={RegisterScreen}/>
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen}/>
      <Stack.Screen name="OpportunityDetails" component={OpportunityDetailsScreen}/>
      <Stack.Screen name="EventDetails" component={EventDetailsScreen}/>
    </>
  ) : (
    <>
      <Stack.Screen name="CreatePortfolio" component={CreatePortfolioScreen}/>
      <Stack.Screen name="CustomizeProfile" component={CustomizeProfileScreen}/>
      <Stack.Screen name="Tabs" component={AppTabs}/>
      <Stack.Screen name="EditProfile" component={EditProfileScreen}/>
      <Stack.Screen name="SelectLocation" component={SelectLocationScreen}/>
      <Stack.Screen name="EditContractorProfile" component={EditContractorProfileScreen}/>
      <Stack.Screen name="PortfolioCreation" component={PortfolioCreationScreen}/>
      <Stack.Screen name="Settings" component={SettingsScreen}/>
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen}/>
      <Stack.Screen name="ManageOpportunities" component={ManageOpportunitiesScreen}/>
      <Stack.Screen name="Opportunities" component={OpportunitiesScreen}/>
      <Stack.Screen name="OpportunityDetails" component={OpportunityDetailsScreen}/>
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen}/>
      <Stack.Screen name="Events" component={EventsScreen}/>
      <Stack.Screen name="EventDetails" component={EventDetailsScreen}/>
      <Stack.Screen name="CreateEvent" component={CreateEventScreen}/>
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
