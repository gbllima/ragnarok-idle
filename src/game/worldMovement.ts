type Point={x:number;y:number}

const huntSpots:Point[]=[
  {x:.44,y:.43},{x:.58,y:.38},{x:.69,y:.47},{x:.76,y:.59},
  {x:.64,y:.69},{x:.51,y:.66},{x:.38,y:.58},{x:.72,y:.36},
]

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)

function zonePoint(el:HTMLElement,zone:HTMLElement):Point{
  const zr=zone.getBoundingClientRect(),r=el.getBoundingClientRect()
  return {x:r.left-zr.left+r.width/2,y:r.top-zr.top+r.height/2}
}

function placePercent(el:HTMLElement,p:Point){
  el.style.left=`${p.x*100}%`
  el.style.top=`${p.y*100}%`
}

function chooseSpot(current?:Point){
  const shuffled=[...huntSpots].sort(()=>Math.random()-.5)
  if(!current)return shuffled[0]
  return shuffled.find(p=>Math.hypot(p.x-current.x,p.y-current.y)>.18)??shuffled[0]
}

export function installWorldMovement(){
  if(typeof document==='undefined')return()=>{}

  let raf=0,last=performance.now(),wasDead=false
  let decorTimer=0

  const tick=(now:number)=>{
    const dt=Math.min(.05,(now-last)/1000);last=now
    const zone=document.querySelector<HTMLElement>('.hunt-zone')
    const player=document.querySelector<HTMLElement>('.player-sprite')
    const mob=document.querySelector<HTMLElement>('.main-mob')
    const startBtn=document.querySelector<HTMLButtonElement>('.stop-btn')

    if(zone&&player&&mob&&startBtn){
      const running=!startBtn.classList.contains('paused')
      const dead=mob.classList.contains('dead')
      const zr=zone.getBoundingClientRect()

      mob.style.transition='left .28s ease, top .28s ease'

      if(wasDead&&!dead){
        const current={x:(parseFloat(mob.style.left)||62)/100,y:(parseFloat(mob.style.top)||50)/100}
        placePercent(mob,chooseSpot(current))
      }
      wasDead=dead

      const p=zonePoint(player,zone)
      const m=zonePoint(mob,zone)
      const d=distance(p,m)
      const attackRange=92

      if(running&&!dead&&d>attackRange){
        const speed=210
        const nx=p.x+(m.x-p.x)/d*speed*dt
        const ny=p.y+(m.y-p.y)/d*speed*dt
        const halfW=player.getBoundingClientRect().width/2
        const halfH=player.getBoundingClientRect().height/2
        player.style.left=`${clamp(nx,210+halfW,zr.width-335-halfW)}px`
        player.style.top=`${clamp(ny,zr.height*.34+halfH,zr.height-95-halfH)}px`
        player.style.animation='none'
        player.dataset.roWalking='1'
        const img=player.querySelector<HTMLImageElement>('img')
        if(img)img.style.transform=m.x<p.x?'scaleX(-1)':'scaleX(1)'
        const slash=player.querySelector<HTMLElement>('.slash')
        if(slash)slash.style.display='none'
      }else{
        player.dataset.roWalking='0'
        player.style.animation=''
        const slash=player.querySelector<HTMLElement>('.slash')
        if(slash)slash.style.display=''
      }

      decorTimer+=dt
      if(decorTimer>4){
        decorTimer=0
        document.querySelectorAll<HTMLElement>('.mob-2,.mob-3').forEach((el,i)=>{
          el.style.transition='left 2.8s linear, top 2.8s linear'
          const p=chooseSpot()
          placePercent(el,{x:clamp(p.x+(i?.035:-.025),.36,.79),y:clamp(p.y+(i?.03:-.035),.36,.72)})
        })
      }
    }

    raf=requestAnimationFrame(tick)
  }

  raf=requestAnimationFrame(tick)
  return()=>cancelAnimationFrame(raf)
}
