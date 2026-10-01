import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '@/providers/theme-provider';
import { useUser } from '@/providers/user-provider';
import { useManagement } from '@/providers/management-provider';
import type { RootStackParamList } from '../../../navigation/app-navigator';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'EventDetails'>;
type EventRoute = RouteProp<RootStackParamList, 'EventDetails'>;

export default function EventDetailsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<EventRoute>();
  const { palette } = useTheme();
  const { user } = useUser();
  const { eventos, solicitacoesEvento, enviarSolicitacaoEvento } = useManagement();
  const [enviando, setEnviando] = useState(false);

  const evento = eventos.find((item) => item.id === route.params.eventId);

  if (!evento) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: palette.brandInk }]}>Evento não encontrado</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: palette.brandCoral }]}>
            <Text style={[styles.buttonText, { color: palette.brandPaper }]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const data = new Date(evento.data + 'T12:00:00');
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(data);
  const semana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(data);
  const isAgente = user.tipo === 'AGENTE';
  const solicitacao = solicitacoesEvento.find((item) => item.eventId === evento.id && item.agenteId === user.id);
  const statusSolicitacao = solicitacao?.status;

  const solicitarParticipacao = () => {
    if (statusSolicitacao === 'PENDENTE' || statusSolicitacao === 'ACEITA' || enviando) return;

    Alert.alert(
      'Enviar solicitação',
      `Deseja enviar uma solicitação ao contratante para participar de "${evento.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setEnviando(true);
            try {
              await enviarSolicitacaoEvento({
                eventId: evento.id,
                eventoTitulo: evento.titulo,
                agenteId: user.id,
                agenteNome: user.nomeSocial || user.nome,
                agenteEspecialidade: user.especialidade || 'Profissional criativo',
                mensagem: 'Olá! Gostaria de participar deste projeto como agente criativo.',
              });
              Alert.alert('Solicitação enviada', 'O contratante recebeu seu pedido de participação.');
            } catch (error) {
              Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente.');
            } finally {
              setEnviando(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: palette.brandInk }]}>
          <View style={[styles.shapeBlue, { backgroundColor: palette.brandBlue }]} />
          <View style={[styles.shapeGreen, { backgroundColor: palette.brandGreen }]} />
          <View style={[styles.shapeCoral, { backgroundColor: palette.brandCoral }]} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backCircle, { backgroundColor: palette.brandPaper }]}>
            <Ionicons name="arrow-back" size={22} color={palette.brandInk} />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={[styles.kicker, { color: palette.brandSand }]}>{evento.categoria.toUpperCase()}</Text>
            <Text style={[styles.heroTitle, { color: palette.brandPaper }]}>{evento.titulo}</Text>
            {evento.premium && (
              <View style={[styles.premium, { backgroundColor: palette.brandGreen }]}>
                <Ionicons name="star" size={12} color={palette.brandPaper} />
                <Text style={[styles.premiumText, { color: palette.brandPaper }]}>EVENTO PREMIUM</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.datePanel, { backgroundColor: palette.brandSand, borderColor: palette.brandInk }]}>
          <Text style={[styles.day, { color: palette.brandInk }]}>{dia}</Text>
          <View style={styles.dateInfo}>
            <Text style={[styles.weekday, { color: palette.brandInk }]}>{semana.toUpperCase()}</Text>
            <Text style={[styles.month, { color: palette.brandInk }]}>{mes.toUpperCase()}</Text>
            <Text style={[styles.time, { color: palette.brandInk }]}>{evento.horario}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.brandPaper, borderColor: palette.brandInk }]}>
          <Text style={[styles.sectionTitle, { color: palette.brandInk }]}>SOBRE O EVENTO</Text>
          <Text style={[styles.description, { color: palette.muted }]}>{evento.descricao}</Text>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: palette.brandBlue }]}>
              <Ionicons name="location" size={18} color={palette.brandInk} />
            </View>
            <View style={styles.infoCopy}>
              <Text style={[styles.infoLabel, { color: palette.muted }]}>LOCAL</Text>
              <Text style={[styles.infoValue, { color: palette.brandInk }]}>{evento.local}</Text>
              <Text style={[styles.infoSecondary, { color: palette.muted }]}>{evento.cidade}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: palette.brandGreen }]}>
              <Ionicons name="people" size={18} color={palette.brandPaper} />
            </View>
            <View style={styles.infoCopy}>
              <Text style={[styles.infoLabel, { color: palette.muted }]}>ORGANIZAÇÃO</Text>
              <Text style={[styles.infoValue, { color: palette.brandInk }]}>{evento.organizador}</Text>
            </View>
          </View>
        </View>

        {isAgente ? (
          <View style={[styles.registration, { backgroundColor: palette.brandInk }]}>
            <View style={styles.registrationCopy}>
              <Text style={[styles.registrationTitle, { color: palette.brandPaper }]}>
                {statusSolicitacao === 'ACEITA' ? 'Solicitação aceita!' : statusSolicitacao === 'PENDENTE' ? 'Solicitação enviada!' : statusSolicitacao === 'RECUSADA' ? 'Solicitação recusada' : 'Quer participar?'}
              </Text>
              <Text style={[styles.registrationText, { color: palette.brandPaper }]}>
                {statusSolicitacao === 'ACEITA'
                  ? 'O contratante aceitou sua solicitação para este projeto.'
                  : statusSolicitacao === 'PENDENTE'
                    ? 'Aguarde o contratante analisar sua solicitação.'
                    : 'Envie uma solicitação ao contratante para participar deste projeto.'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={solicitarParticipacao}
              style={[
                styles.registerButton,
                { backgroundColor: statusSolicitacao === 'ACEITA' ? palette.brandGreen : palette.brandCoral },
              ]}
            >
              <Ionicons name={statusSolicitacao === 'ACEITA' ? 'checkmark-circle' : statusSolicitacao === 'PENDENTE' ? 'time-outline' : 'send-outline'} size={19} color={palette.brandPaper} />
              <Text style={[styles.registerButtonText, { color: palette.brandPaper }]}>
                {statusSolicitacao === 'ACEITA' ? 'ACEITO' : statusSolicitacao === 'PENDENTE' ? 'PENDENTE' : enviando ? 'ENVIANDO...' : 'SOLICITAR'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.restriction, { backgroundColor: palette.brandPaper, borderColor: palette.brandInk }]}>
            <Ionicons name="information-circle-outline" size={22} color={palette.brandCoral} />
            <Text style={[styles.restrictionText, { color: palette.brandInk }]}>
              O cadastro em eventos está disponível para perfis de agente criativo.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 34 },
  hero: { minHeight: 290, borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 14 },
  heroContent: { padding: 22, paddingTop: 76, maxWidth: 330, zIndex: 2 },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.8, marginBottom: 8 },
  heroTitle: { fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1 },
  shapeBlue: { position: 'absolute', width: 115, height: 115, borderRadius: 30, right: -18, bottom: 20, transform: [{ rotate: '20deg' }] },
  shapeGreen: { position: 'absolute', width: 90, height: 48, borderRadius: 10, right: 20, top: 38 },
  shapeCoral: { position: 'absolute', width: 62, height: 135, borderRadius: 10, right: 100, top: -30 },
  backCircle: { position: 'absolute', top: 18, left: 18, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  premium: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, marginTop: 14 },
  premiumText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  datePanel: { borderWidth: 1.5, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  day: { fontSize: 54, lineHeight: 58, fontWeight: '900', width: 88, textAlign: 'center' },
  dateInfo: { borderLeftWidth: 1, borderLeftColor: '#29242B', paddingLeft: 14, flex: 1 },
  weekday: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  month: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  time: { fontSize: 13, fontWeight: '700', marginTop: 5 },
  card: { borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.3, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 21 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1, marginLeft: 11 },
  infoLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  infoValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  infoSecondary: { fontSize: 12, marginTop: 1 },
  registration: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  registrationCopy: { flex: 1 },
  registrationTitle: { fontSize: 17, fontWeight: '900' },
  registrationText: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  registerButton: { minHeight: 46, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  registerButtonText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  restriction: { borderWidth: 1.5, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  restrictionText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { fontSize: 20, fontWeight: '900', marginBottom: 16 },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { fontWeight: '900' },
});
