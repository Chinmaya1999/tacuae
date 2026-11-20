# Converts the original TAC assets (downloaded from the old site) to responsive WebP + a manifest.
import json, sys, os
from PIL import Image
RAW=sys.argv[1]; OUT='public/img'
M={
 # services / editorial (hi-res originals from the existing site)
 'svc-bms':'11062b_3c7350bb75e54ce8a02e6352e33ff909~mv2.jpeg',
 'svc-knx-training':'34dc74_5a6c836ac92b433ba5c7848c9ddd23ed~mv2.jpeg',
 'svc-smart-home':'34dc74_34a938b4e2404f8e82bebefa2a8ab773~mv2.jpg',
 'svc-grms':'34dc74_fff59cd4f31c45b9bf7d5fb97c003d9a~mv2.jpg',
 'svc-lighting':'34dc74_12e6840e40874a80b5125bf40030588e~mv2.jpg',
 'ed-security':'11062b_441b803e3b474f93910676a0719f5a1d~mv2.jpeg',
 'ed-mobile':'11062b_b855fdaf9d4f449b8b4d32df72a0684f~mv2.jpeg',
 'ed-team':'11062b_0d13ca65e55f4cbdb67e7c0ceea2ad87~mv2.jpg',
 'ed-laptop':'11062b_ec10469e0be144949dda8dbb0f943e7d~mv2.jpg',
 'ed-reading':'11062b_27b7c6be7a274669983425c0eae3ba67~mv2.jpg',
 'ed-desk':'34dc74_2ee32e9ebe9b4811adf72487d3cb6340~mv2.jpg',
 'award-2018':'34dc74_941a80a73c5244b7bbbca5586f6744ab~mv2.jpg',
 # projects
 'prj-meydan':'34dc74_cab65db213ee4a2fb3b9681cd6fd0baa~mv2.jpg',
 'prj-asd':'34dc74_45e74f916f614667ba6cfa921759db14~mv2.jpg',
 'prj-lapita':'34dc74_38a36d47fb194de2a188ee07ffc15745~mv2.jpg',
 'prj-fish-market':'34dc74_882cd242758045bf9bd408bf48037486~mv2.jpg',
 'prj-iris-bay':'34dc74_83c7a135f35144eb99d024c396d0b43c~mv2.jpg',
 'prj-cricket':'34dc74_a7327fc9a0e343368e88fdaf4d3dca56~mv2.jpg',
 'prj-westin':'34dc74_735f080fa9aa4b16aa10f618a529f2d6~mv2.jpg',
 'prj-kempinski':'34dc74_9623304fc6ce4838ab811b4d1fe41dac~mv2.jpg',
 'prj-la-verda':'34dc74_b4ac21e4c7094a61aeb8bfddbce0abc2~mv2.jpg',
 'prj-dxb-airport':'34dc74_ab22cccea9c9413bb360aaef01914706~mv2.gif',
 # products
 'prd-flush-power-supply':'34dc74_33a603d552824282a4f8d64de731b9c8~mv2.jpg',
 'prd-audiofy':'34dc74_52c52c592e614c0dad896a67b1b3b5d4~mv2.jpg',
 'prd-rack':'34dc74_8dd703fd214344118992ac8763281214~mv2.jpg',
 'prd-envision':'34dc74_fe0eac5c82494d3a8823e9e14bf18733~mv2.jpg',
 'prd-compact':'34dc74_a444b23e54924f3888c858c44abf8d8a~mv2.jpg',
 'prd-micro':'34dc74_784ea2022cec42ca9df1b265ae1ac74a~mv2.jpg',
 'prd-knx-cable':'34dc74_c42677cc3e1f4da5822b3b899afe8dfa~mv2.jpg',
 'prd-dali-gateway':'34dc74_64b2af1d976a42eb98943572418a6631~mv2.jpg',
 'prd-din-power-supply':'34dc74_4f37cb9664c34509946789769a345a23~mv2.jpg',
 'prd-push-button':'34dc74_4f9813fda9134344bb8cfd85d302b961~mv2.jpg',
 'prd-fan-controller':'34dc74_95b51adf925a4a18a78050a9d117baea~mv2.jpg',
 'prd-switch-actuator':'34dc74_8a14198576bb49bfbf354127a19b35d7~mv2.jpg',
}
manifest={}
for name,fn in M.items():
    im=Image.open(f'{RAW}/{fn}'); im.seek(0); im=im.convert('RGB')
    W,H=im.size; ws=[w for w in (480,960,1600,2400) if w<W]+[min(W,2400)]
    ws=sorted(set(ws)); 
    for w in ws:
        h=round(H*w/W); r=im.resize((w,h),Image.LANCZOS) if w!=W else im
        r.save(f'{OUT}/{name}-{w}.webp','WEBP',quality=80,method=6)
    manifest[name]={'w':W,'h':H,'sizes':ws}
    print(name,W,H,ws)
json.dump(manifest,open('src/data/images.json','w'),indent=1)
# logos: original (dark text) + light variant for dark backgrounds
lg=Image.open(f'{RAW}/34dc74_9008314e7fa7406bad69120672c5320e~mv2.png').convert('RGBA')
lg=lg.crop(lg.getbbox()); lg.thumbnail((900,900))
lg.save(f'{OUT}/logo.png'); 
px=lg.load(); 
for y in range(lg.height):
    for x in range(lg.width):
        r,g,b,a=px[x,y]
        if a and r<70 and g<70 and b<70: px[x,y]=(255,255,255,a)
        elif a and abs(r-g)<14 and abs(g-b)<14 and r>130: px[x,y]=(215,225,236,a)  # grey wedge → silver
lg.save(f'{OUT}/logo-light.png')
lg.resize((192,round(192*lg.height/lg.width))).save('public/favicon.png')
