// Registry of every calculator. Order inside a category defines the order
// of the cards on category pages.

import * as c_salario_liquido from './salario-liquido.js';
import * as c_salario_bruto from './salario-bruto.js';
import * as c_rescisao_trabalhista from './rescisao-trabalhista.js';
import * as c_ferias from './ferias.js';
import * as c_ferias_proporcionais from './ferias-proporcionais.js';
import * as c_venda_de_ferias from './venda-de-ferias.js';
import * as c_decimo_terceiro from './decimo-terceiro.js';
import * as c_decimo_terceiro_proporcional from './decimo-terceiro-proporcional.js';
import * as c_aviso_previo from './aviso-previo.js';
import * as c_hora_extra from './hora-extra.js';
import * as c_adicional_noturno from './adicional-noturno.js';
import * as c_dsr from './dsr.js';
import * as c_banco_de_horas from './banco-de-horas.js';
import * as c_horas_trabalhadas from './horas-trabalhadas.js';
import * as c_salario_por_hora from './salario-por-hora.js';
import * as c_salario_proporcional from './salario-proporcional.js';
import * as c_comissao from './comissao.js';
import * as c_reajuste_salarial from './reajuste-salarial.js';
import * as c_seguro_desemprego from './seguro-desemprego.js';
import * as c_salario_familia from './salario-familia.js';
import * as c_plr from './plr.js';
import * as c_dias_uteis from './dias-uteis.js';
import * as c_inss from './inss.js';
import * as c_imposto_de_renda from './imposto-de-renda.js';
import * as c_fgts from './fgts.js';
import * as c_multa_fgts from './multa-fgts.js';
import * as c_saque_aniversario_fgts from './saque-aniversario-fgts.js';
import * as c_das_mei from './das-mei.js';
import * as c_simples_nacional from './simples-nacional.js';
import * as c_pro_labore from './pro-labore.js';
import * as c_inss_autonomo from './inss-autonomo.js';
import * as c_juros_compostos from './juros-compostos.js';
import * as c_juros_simples from './juros-simples.js';
import * as c_financiamento from './financiamento.js';
import * as c_parcelamento from './parcelamento.js';
import * as c_a_vista_ou_parcelado from './a-vista-ou-parcelado.js';
import * as c_investimentos from './investimentos.js';
import * as c_rendimento_poupanca from './rendimento-poupanca.js';
import * as c_reserva_de_emergencia from './reserva-de-emergencia.js';
import * as c_meta_de_investimento from './meta-de-investimento.js';
import * as c_independencia_financeira from './independencia-financeira.js';
import * as c_valor_presente_futuro from './valor-presente-futuro.js';
import * as c_juros_de_atraso from './juros-de-atraso.js';
import * as c_correcao_monetaria from './correcao-monetaria.js';
import * as c_reajuste_aluguel from './reajuste-aluguel.js';
import * as c_inflacao from './inflacao.js';
import * as c_conversor_de_moedas from './conversor-de-moedas.js';
import * as c_preco_de_venda from './preco-de-venda.js';
import * as c_margem_de_lucro from './margem-de-lucro.js';
import * as c_markup from './markup.js';
import * as c_lucro_do_negocio from './lucro-do-negocio.js';
import * as c_ponto_de_equilibrio from './ponto-de-equilibrio.js';
import * as c_custo_de_funcionario from './custo-de-funcionario.js';
import * as c_clt_x_pj from './clt-x-pj.js';
import * as c_valor_hora_freelancer from './valor-hora-freelancer.js';
import * as c_porcentagem from './porcentagem.js';
import * as c_aumento_percentual from './aumento-percentual.js';
import * as c_desconto from './desconto.js';
import * as c_regra_de_tres from './regra-de-tres.js';
import * as c_alcool_ou_gasolina from './alcool-ou-gasolina.js';
import * as c_custo_de_viagem from './custo-de-viagem.js';

const MODULES = [
  ['salario-liquido.js', c_salario_liquido],
  ['salario-bruto.js', c_salario_bruto],
  ['rescisao-trabalhista.js', c_rescisao_trabalhista],
  ['ferias.js', c_ferias],
  ['ferias-proporcionais.js', c_ferias_proporcionais],
  ['venda-de-ferias.js', c_venda_de_ferias],
  ['decimo-terceiro.js', c_decimo_terceiro],
  ['decimo-terceiro-proporcional.js', c_decimo_terceiro_proporcional],
  ['aviso-previo.js', c_aviso_previo],
  ['hora-extra.js', c_hora_extra],
  ['adicional-noturno.js', c_adicional_noturno],
  ['dsr.js', c_dsr],
  ['banco-de-horas.js', c_banco_de_horas],
  ['horas-trabalhadas.js', c_horas_trabalhadas],
  ['salario-por-hora.js', c_salario_por_hora],
  ['salario-proporcional.js', c_salario_proporcional],
  ['comissao.js', c_comissao],
  ['reajuste-salarial.js', c_reajuste_salarial],
  ['seguro-desemprego.js', c_seguro_desemprego],
  ['salario-familia.js', c_salario_familia],
  ['plr.js', c_plr],
  ['dias-uteis.js', c_dias_uteis],
  ['inss.js', c_inss],
  ['imposto-de-renda.js', c_imposto_de_renda],
  ['fgts.js', c_fgts],
  ['multa-fgts.js', c_multa_fgts],
  ['saque-aniversario-fgts.js', c_saque_aniversario_fgts],
  ['das-mei.js', c_das_mei],
  ['simples-nacional.js', c_simples_nacional],
  ['pro-labore.js', c_pro_labore],
  ['inss-autonomo.js', c_inss_autonomo],
  ['juros-compostos.js', c_juros_compostos],
  ['juros-simples.js', c_juros_simples],
  ['financiamento.js', c_financiamento],
  ['parcelamento.js', c_parcelamento],
  ['a-vista-ou-parcelado.js', c_a_vista_ou_parcelado],
  ['investimentos.js', c_investimentos],
  ['rendimento-poupanca.js', c_rendimento_poupanca],
  ['reserva-de-emergencia.js', c_reserva_de_emergencia],
  ['meta-de-investimento.js', c_meta_de_investimento],
  ['independencia-financeira.js', c_independencia_financeira],
  ['valor-presente-futuro.js', c_valor_presente_futuro],
  ['juros-de-atraso.js', c_juros_de_atraso],
  ['correcao-monetaria.js', c_correcao_monetaria],
  ['reajuste-aluguel.js', c_reajuste_aluguel],
  ['inflacao.js', c_inflacao],
  ['conversor-de-moedas.js', c_conversor_de_moedas],
  ['preco-de-venda.js', c_preco_de_venda],
  ['margem-de-lucro.js', c_margem_de_lucro],
  ['markup.js', c_markup],
  ['lucro-do-negocio.js', c_lucro_do_negocio],
  ['ponto-de-equilibrio.js', c_ponto_de_equilibrio],
  ['custo-de-funcionario.js', c_custo_de_funcionario],
  ['clt-x-pj.js', c_clt_x_pj],
  ['valor-hora-freelancer.js', c_valor_hora_freelancer],
  ['porcentagem.js', c_porcentagem],
  ['aumento-percentual.js', c_aumento_percentual],
  ['desconto.js', c_desconto],
  ['regra-de-tres.js', c_regra_de_tres],
  ['alcool-ou-gasolina.js', c_alcool_ou_gasolina],
  ['custo-de-viagem.js', c_custo_de_viagem],
];

export const CALCULATORS = MODULES.map(([file, m]) => ({ file, meta: m.meta, ui: m.ui, content: m.content }));

// Most used first (home page, 404 and search ranking), based on Brazilian
// search demand for each topic.
export const POPULAR = [
  'salario-liquido', 'rescisao-trabalhista', 'ferias', 'decimo-terceiro', 'porcentagem', 'juros-compostos',
  'seguro-desemprego', 'hora-extra', 'clt-x-pj', 'financiamento', 'investimentos', 'correcao-monetaria',
  'imposto-de-renda', 'inss', 'fgts', 'reajuste-aluguel', 'das-mei', 'preco-de-venda',
];
