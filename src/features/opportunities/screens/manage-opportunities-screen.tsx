import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ReviewFormModal } from '@/features/reviews/components/review-form-modal';
import { useManagement } from '@/providers/management-provider';
import { useReviews } from '@/providers/reviews-provider';
import { colors } from '@/shared/theme/colors';
import type { Candidato, VagaGerenciada } from '../../../features/opportunities/screens/types/management';
import { StarRating } from '../../../features/reviews/components/star-rating';

const STATUS_LABEL: Record<VagaGerenciada['status'], string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
};

const STATUS_COR: Record<VagaGerenciada['status'], string> = {
  ABERTA: colors.brandCoral,
  EM_ANDAMENTO: colors.brandBlue,
  CONCLUIDA: colors.muted,
};

export default function ManageOpportunitiesScreen() {
  const navigation = useNavigation<any>();
  const {
    vagas,
    solicitacoesEvento,
    aceitarCandidato,
    recusarCandidato,
    concluirVaga,
    marcarAvaliado,
    aceitarSolicitacaoEvento,
    recusarSolicitacaoEvento,
  } = useManagement();
  const { adicionarAvaliacao } = useReviews();
  const [expandida, setExpandida] = useState<string | null>(null);
  const [avaliando, setAvaliando] = useState<{
    vagaId: string;
    candidato: Candidato;
  } | null>(null);

  const responder = (
    vaga: VagaGerenciada,
    candidato: Candidato,
    status: 'ACEITA' | 'RECUSADA',
  ) => {
    if (status === 'ACEITA') {
      Alert.alert(
        'Aceitar candidato',
        `Confirmar ${candidato.nome} para "${vaga.titulo}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Aceitar',
            onPress: () => aceitarCandidato(vaga.id, candidato.id),
          },
        ],
      );
    } else {
      recusarCandidato(vaga.id, candidato.id);
    }
  };

  const concluir = (vaga: VagaGerenciada) => {
    Alert.alert('Concluir projeto', 'Marcar este projeto como concluído?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Concluir', onPress: () => concluirVaga(vaga.id) },
    ]);
  };

  const abrirAvaliacao = (vaga: VagaGerenciada) => {
    const contratado = vaga.candidatos.find((item) => item.status === 'ACEITA');
    if (!contratado) return;
    setAvaliando({ vagaId: vaga.id, candidato: contratado });
  };

  const enviarAvaliacao = ({
    nota,
    comentario,
  }: {
    nota: number;
    comentario: string;
  }) => {
    if (!avaliando) return;
    adicionarAvaliacao({
      agenteId: avaliando.candidato.agenteId,
      autorNome: 'Você',
      nota,
      comentario,
    });
    marcarAvaliado(avaliando.vagaId);
    const nome = avaliando.candidato.nome;
    setAvaliando(null);
    Alert.alert('Avaliação enviada!', `Obrigado por avaliar ${nome}.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={20} color={colors.brandInk} />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>GESTÃO</Text>
          <Text style={styles.title}>Minhas vagas</Text>
        </View>

        <View style={styles.headerMark}>
          <View style={styles.headerMarkShape} />
        </View>
      </View>

      {solicitacoesEvento.length > 0 ? (
        <View style={styles.eventRequestsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>PARTICIPAÇÕES</Text>
              <Text style={styles.sectionTitle}>Solicitações para eventos</Text>
            </View>
            <Text style={styles.count}>{solicitacoesEvento.length}</Text>
          </View>

          {solicitacoesEvento.map((solicitacao) => (
            <View key={solicitacao.id} style={styles.eventRequestCard}>
              <View style={styles.flex1}>
                <Text style={styles.eventRequestEvent}>{solicitacao.eventoTitulo}</Text>
                <Text style={styles.candidatoNome}>{solicitacao.agenteNome}</Text>
                <Text style={styles.candidatoEspecialidade}>
                  {solicitacao.agenteEspecialidade}
                </Text>
                <Text style={styles.candidatoMensagem}>{solicitacao.mensagem}</Text>

                {solicitacao.status === 'PENDENTE' ? (
                  <View style={styles.candidatoActions}>
                    <TouchableOpacity
                      style={styles.recusar}
                      onPress={() => recusarSolicitacaoEvento(solicitacao.id)}
                    >
                      <Text style={styles.recusarText}>RECUSAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.aceitar}
                      onPress={() => aceitarSolicitacaoEvento(solicitacao.id)}
                    >
                      <Text style={styles.aceitarText}>ACEITAR</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.statusCandidato,
                      solicitacao.status === 'ACEITA'
                        ? styles.statusAceito
                        : styles.statusRecusado,
                    ]}
                  >
                    {solicitacao.status === 'ACEITA'
                      ? '✓ Solicitação aceita'
                      : 'Solicitação recusada'}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <FlatList
        data={vagas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="briefcase-outline" size={30} color={colors.brandCoral} />
            <Text style={styles.emptyTitle}>Você ainda não publicou vagas</Text>
            <Text style={styles.emptyText}>
              As vagas publicadas e suas candidaturas aparecerão aqui.
            </Text>
          </View>
        }
        renderItem={({ item: vaga }) => {
          const aberta = expandida === vaga.id;
          const contratado = vaga.candidatos.find((c) => c.status === 'ACEITA');

          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandida(aberta ? null : vaga.id)}
                activeOpacity={0.75}
              >
                <View style={styles.flex1}>
                  <Text style={styles.category}>{vaga.categoria}</Text>
                  <Text style={styles.vagaTitulo}>{vaga.titulo}</Text>
                  <Text style={styles.candidatosCount}>
                    {vaga.candidatos.length} candidato
                    {vaga.candidatos.length === 1 ? '' : 's'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.badge,
                    { backgroundColor: STATUS_COR[vaga.status] },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      vaga.status === 'EM_ANDAMENTO' && { color: colors.brandInk },
                    ]}
                  >
                    {STATUS_LABEL[vaga.status]}
                  </Text>
                </View>

                <Ionicons
                  name={aberta ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>

              {aberta ? (
                <View style={styles.candidatos}>
                  {vaga.candidatos.length === 0 ? (
                    <Text style={styles.emptyText}>
                      Nenhuma candidatura recebida ainda.
                    </Text>
                  ) : null}

                  {vaga.candidatos.map((candidato) => (
                    <View key={candidato.id} style={styles.candidatoCard}>
                      <Image source={{ uri: candidato.avatarUrl }} style={styles.avatar} />

                      <View style={styles.flex1}>
                        <View style={styles.candidatoTop}>
                          <Text style={styles.candidatoNome}>{candidato.nome}</Text>
                          <StarRating value={candidato.avaliacao} size={12} />
                        </View>

                        <Text style={styles.candidatoEspecialidade}>
                          {candidato.especialidade}
                        </Text>
                        <Text style={styles.candidatoMensagem}>
                          {candidato.mensagem}
                        </Text>

                        {candidato.status === 'PENDENTE' ? (
                          <View style={styles.candidatoActions}>
                            <TouchableOpacity
                              style={styles.recusar}
                              onPress={() => responder(vaga, candidato, 'RECUSADA')}
                            >
                              <Text style={styles.recusarText}>RECUSAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.aceitar}
                              onPress={() => responder(vaga, candidato, 'ACEITA')}
                            >
                              <Text style={styles.aceitarText}>ACEITAR</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.statusCandidato,
                              candidato.status === 'ACEITA'
                                ? styles.statusAceito
                                : styles.statusRecusado,
                            ]}
                          >
                            {candidato.status === 'ACEITA' ? '✓ CONTRATADO' : 'RECUSADO'}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}

                  {vaga.status === 'EM_ANDAMENTO' && contratado ? (
                    <TouchableOpacity style={styles.concluir} onPress={() => concluir(vaga)}>
                      <Text style={styles.concluirText}>CONCLUIR PROJETO</Text>
                      <Ionicons name="arrow-forward" size={15} color={colors.brandPaper} />
                    </TouchableOpacity>
                  ) : null}

                  {vaga.status === 'CONCLUIDA' && contratado && !vaga.avaliado ? (
                    <TouchableOpacity
                      style={styles.avaliar}
                      onPress={() => abrirAvaliacao(vaga)}
                    >
                      <Ionicons name="star" size={15} color={colors.brandInk} />
                      <Text style={styles.avaliarText}>
                        AVALIAR {contratado.nome.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {vaga.status === 'CONCLUIDA' && vaga.avaliado ? (
                    <Text style={styles.avaliadoText}>
                      Você já avaliou este profissional.
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        }}
      />

      <ReviewFormModal
        visible={!!avaliando}
        agenteNome={avaliando?.candidato.nome ?? ''}
        onClose={() => setAvaliando(null)}
        onSubmit={enviarAvaliacao}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandPaper,
  },
  header: {
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  back: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  kicker: {
    color: colors.brandCoral,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.brandInk,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 2,
  },
  headerMark: {
    width: 44,
    height: 44,
    backgroundColor: colors.brandInk,
    overflow: 'hidden',
    position: 'relative',
  },
  headerMarkShape: {
    position: 'absolute',
    width: 38,
    height: 38,
    right: -10,
    bottom: -10,
    backgroundColor: colors.brandCoral,
    transform: [{ rotate: '20deg' }],
  },
  eventRequestsSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 12,
  },
  sectionKicker: {
    color: colors.brandCoral,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.35,
    marginBottom: 2,
  },
  sectionTitle: {
    color: colors.brandInk,
    fontSize: 17,
    fontWeight: '900',
  },
  count: {
    color: colors.brandPaper,
    backgroundColor: colors.brandInk,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '900',
  },
  list: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 34,
    gap: 12,
  },
  eventRequestCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  eventRequestEvent: {
    color: colors.brandCoral,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex1: { flex: 1, minWidth: 0 },
  category: {
    color: colors.brandCoral,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  vagaTitulo: {
    color: colors.brandInk,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '900',
    marginTop: 3,
  },
  candidatosCount: {
    color: colors.muted,
    fontSize: 10.5,
    marginTop: 4,
  },
  badge: {
    minHeight: 24,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.brandPaper,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  candidatos: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 13,
    gap: 9,
  },
  candidatoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    backgroundColor: colors.white,
  },
  candidatoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  candidatoNome: {
    color: colors.brandInk,
    fontWeight: '900',
    fontSize: 12,
    flex: 1,
  },
  candidatoEspecialidade: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2,
  },
  candidatoMensagem: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  candidatoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  recusar: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recusarText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 8,
    letterSpacing: 0.9,
  },
  aceitar: {
    flex: 1,
    minHeight: 36,
    backgroundColor: colors.brandInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aceitarText: {
    color: colors.brandPaper,
    fontWeight: '900',
    fontSize: 8,
    letterSpacing: 0.9,
  },
  statusCandidato: {
    marginTop: 8,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusAceito: { color: colors.brandGreen },
  statusRecusado: { color: colors.muted },
  concluir: {
    minHeight: 42,
    backgroundColor: colors.brandInk,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  concluirText: {
    color: colors.brandPaper,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avaliar: {
    minHeight: 42,
    backgroundColor: colors.brandSand,
    borderWidth: 1,
    borderColor: colors.brandInk,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  avaliarText: {
    color: colors.brandInk,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.brandInk,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 9,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 280,
  },
  avaliadoText: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
