# Ragnarok Idle

## Executar

```sh
npm install
npm run build
npm run server
```

Abra http://localhost:8787. O servidor entrega o jogo compilado, a API e os recursos locais. Para desenvolvimento, use `npm run dev` e mantenha `npm run server` em outro terminal. `VITE_API_URL` permite configurar outra origem de API no build.

## Sprites de Ragnarok

Os arquivos em `public/ro/` acompanham o projeto e são copiados para `dist/ro/` pelo build. Nenhuma imagem depende de hotlink durante a partida:

- 23 monstros, incluindo os que não tinham sprites: Chonchon, Elder Willow, Steel Chonchon e Sandman.
- 6 classes: Novice, Swordsman, Mage, Archer, Acolyte e Thief. O visual acompanha a classe do save.
- Idle, caminhada, ataque, dano e morte em oito direções, em PNG/APNG.
- Ícones para os 76 itens do jogo em drops, inventário, loja, equipamentos e recompensas offline.
- Texturas originais de terreno e prévias de Prontera, Geffen, Payon e Sograt, distribuídas pelos cinco ambientes. O cenário de caça é uma adaptação 2D com as texturas originais; não reproduz a geometria, objetos ou colisões dos mapas 3D do cliente de Ragnarok. Áreas do idle compartilham o mapa visual do seu ambiente.

```sh
npm run assets:verify
npm run assets:sync
```

A sincronização requer Node 22.18+ ou 24+, baixa com concorrência limitada e reaproveita arquivos existentes. O catálogo usado pela interface fica em `src/game/ro-assets.json`. `public/ro/sources.json` registra a URL, o tamanho e o SHA-256 de cada arquivo. Para atualizar um recurso já baixado, remova apenas o arquivo correspondente antes de sincronizar novamente.

Fontes: [ragassets](https://github.com/adsonpleal/ragassets) para sprites e texturas, [Divine Pride](https://www.divine-pride.net/) para prévias de mapas e [rAthena](https://github.com/rathena/rathena) para IDs de itens. Novice Sword e Iron Shield são equipamentos próprios do idle e usam ícones equivalentes de Ragnarok. Os recursos de Ragnarok Online pertencem à Gravity; os créditos das ferramentas não transferem os direitos dos recursos do jogo.
