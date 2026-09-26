/** Camera over the dealership tile grid. Build Mode can use an oblique 2.5D projection. */
export type Projection = 'topdown' | 'iso';

export class Camera {
  x = 15; y = 10; zoom = 24; width = 800; height = 600; min = 7; max = 90;
  bounds = { x0: -6, y0: -6, x1: 36, y1: 30 };
  projection: Projection = 'topdown';

  setProjection(mode: Projection): void { this.projection = mode; this.clamp(); }

  private basis(): { ax:number; ay:number; bx:number; by:number } {
    const z=this.zoom; return { ax:z*.84, ay:z*.42, bx:-z*.84, by:z*.42 };
  }
  toScreen(wx:number,wy:number):{x:number;y:number}{
    if(this.projection==='topdown') return {x:(wx-this.x)*this.zoom+this.width/2,y:(wy-this.y)*this.zoom+this.height/2};
    const b=this.basis(),dx=wx-this.x,dy=wy-this.y;
    return {x:dx*b.ax+dy*b.bx+this.width/2,y:dx*b.ay+dy*b.by+this.height/2};
  }
  toWorld(sx:number,sy:number):{x:number;y:number}{
    if(this.projection==='topdown') return {x:(sx-this.width/2)/this.zoom+this.x,y:(sy-this.height/2)/this.zoom+this.y};
    const b=this.basis(),sxn=sx-this.width/2,syn=sy-this.height/2,det=b.ax*b.by-b.bx*b.ay;
    return {x:(sxn*b.by-b.bx*syn)/det+this.x,y:(b.ax*syn-sxn*b.ay)/det+this.y};
  }
  panBy(dxPx:number,dyPx:number):void{
    if(this.projection==='topdown'){this.x-=dxPx/this.zoom;this.y-=dyPx/this.zoom;}
    else {const b=this.basis(),det=b.ax*b.by-b.bx*b.ay;this.x-=(dxPx*b.by-b.bx*dyPx)/det;this.y-=(b.ax*dyPx-dxPx*b.ay)/det;}
    this.clamp();
  }
  zoomAt(factor:number,sx:number,sy:number):void{
    const before=this.toWorld(sx,sy);this.zoom=Math.max(this.min,Math.min(this.max,this.zoom*factor));
    const after=this.toWorld(sx,sy);this.x+=before.x-after.x;this.y+=before.y-after.y;this.clamp();
  }
  fit(x0:number,y0:number,x1:number,y1:number,pad={top:60,bottom:90,left:20,right:20}):void{
    const w=Math.max(1,this.width-pad.left-pad.right),h=Math.max(1,this.height-pad.top-pad.bottom);
    const ww=Math.max(1,x1-x0),wh=Math.max(1,y1-y0);
    this.zoom=this.projection==='topdown'
      ? Math.max(this.min,Math.min(this.max,Math.min(w/ww,h/wh)))
      : Math.max(this.min,Math.min(this.max,Math.min(w/((ww+wh)*.84),h/((ww+wh)*.42))));
    this.x=(x0+x1)/2-(pad.left-pad.right)/2/this.zoom;
    this.y=(y0+y1)/2-(pad.top-pad.bottom)/2/this.zoom;this.clamp();
  }
  resize(width:number,height:number):void{this.width=Math.max(1,width);this.height=Math.max(1,height);this.clamp();}
  setBounds(x0:number,y0:number,x1:number,y1:number):void{this.bounds={x0,y0,x1,y1};this.clamp();}
  clamp():void{
    const b=this.bounds,hw=this.width/2/this.zoom,hh=this.height/2/this.zoom,extra=this.projection==='iso'?1.35:.5;
    this.x=Math.max(b.x0-hw*extra,Math.min(b.x1+hw*extra,this.x));
    this.y=Math.max(b.y0-hh*extra,Math.min(b.y1+hh*extra,this.y));
  }
}
