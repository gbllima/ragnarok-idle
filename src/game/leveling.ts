import type { MapDef } from './starterData'

export type LevelingStage={
  id:string
  min:number
  max:number
  title:string
  hub:string
  goal:string
  gear:string
  tip:string
  mvp?:boolean
}

export const levelingStages:LevelingStage[]=[
  {id:'novice',min:1,max:9,title:'Academia do Novice',hub:'Prontera',goal:'Chegue ao Base 10 e Job 10 para escolher sua primeira classe.',gear:'Use o equipamento inicial e guarde consumíveis.',tip:'Prefira monstros do seu nível ou até 3 níveis acima.'},
  {id:'first-1',min:10,max:24,title:'Primeiros passos da 1ª classe',hub:'Prontera / Payon',goal:'Aprenda suas primeiras skills e construa um conjunto básico de equipamentos.',gear:'Busque arma e armadura da sua classe entre Base 10 e 25.',tip:'Comece a usar Auto Hunt e mantenha cura automática ativa.'},
  {id:'first-2',min:25,max:39,title:'Preparação para a 2ª classe',hub:'Payon / Morroc',goal:'Alcance Base 40 e Job 40 para liberar sua segunda classe.',gear:'Priorize arma melhor, escudo/armadura e a primeira carta útil.',tip:'Refino baixo (+3 a +5) já acelera bastante as caçadas.'},
  {id:'second-1',min:40,max:54,title:'Início da 2ª classe',hub:'Geffen / Payon',goal:'Evolua a árvore de skills da segunda classe e estabilize sua sobrevivência.',gear:'Monte um conjunto Base 40+ e refine a arma principal.',tip:'Troque de caça quando o ganho cair por diferença de nível.'},
  {id:'second-2',min:55,max:69,title:'Progressão intermediária',hub:'Morroc / Geffen',goal:'Fortaleça atributos, cartas e refino antes das áreas avançadas.',gear:'Procure equipamentos Base 55–70 e cartas compatíveis com sua build.',tip:'Elemento correto começa a fazer grande diferença no tempo por kill.'},
  {id:'advanced',min:70,max:84,title:'Campos avançados',hub:'Al De Baran',goal:'Prepare o personagem para a reta final até o 99.',gear:'Busque peças Base 70+ e arma refinada de nível alto.',tip:'Evite permanecer em monstros muito abaixo do seu Base; a EXP é reduzida.'},
  {id:'mvp',min:85,max:98,title:'Reta final e primeiro MVP',hub:'Al De Baran / Campos Avançados',goal:'Chegue ao Base 99 e derrote ao menos um MVP adequado ao seu poder.',gear:'Finalize arma, armadura, cartas e consumíveis para chefes.',tip:'MVP não gera progresso offline e possui respawn maior.',mvp:true},
  {id:'rebirth',min:99,max:999,title:'Base 99 · Rebirth',hub:'Campos Avançados',goal:'Conclua o Rebirth para abrir a progressão transcendente e continuar a jornada.',gear:'Mantenha seus melhores conhecimentos de build; o Rebirth reinicia a jornada.',tip:'Antes de renascer, teste seu conjunto em um MVP próximo do seu nível.',mvp:true},
]

export function levelingStage(level:number){return levelingStages.find(stage=>level>=stage.min&&level<=stage.max)??levelingStages[levelingStages.length-1]}
export function levelingStageProgress(level:number){const stage=levelingStage(level);if(stage.max>=999)return 100;return Math.max(0,Math.min(100,Math.round((level-stage.min)/Math.max(1,stage.max-stage.min+1)*100)))}
export function routeLevelLabel(level:number){const stage=levelingStage(level);return stage.max>=999?`Base ${stage.min}+`:`Base ${stage.min}–${stage.max}`}

export function firstMvpForLevel(maps:MapDef[],baseLevel:number){
  return maps
    .filter(map=>map.boss&&baseLevel>=map.minLevel&&map.monsterLevel<=baseLevel+3&&map.monsterLevel>=Math.max(1,baseLevel-20))
    .sort((a,b)=>Math.abs(a.monsterLevel-baseLevel)-Math.abs(b.monsterLevel-baseLevel)||a.monsterHp-b.monsterHp)[0]
}
