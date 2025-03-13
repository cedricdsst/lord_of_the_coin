// client/src/utils/SpriteAnimation.js
class SpriteAnimation {
  constructor(options) {
    this.frames = [];
    this.currentFrame = 0;
    this.frameDelay = options.frameDelay || 5; // Nombre de frames à attendre avant de passer à l'image suivante
    this.frameCounter = 0;
    this.width = options.width || 32;
    this.height = options.height || 32;
    this.flipped = false;
  }

  // Charge les images d'une animation
  async loadFrames(basePath, count, prefix = '', extension = '.png') {
    this.frames = [];
    for (let i = 0; i < count; i++) {
      const paddedIndex = i.toString().padStart(2, '0');
      const img = new Image();
      img.src = `${basePath}/${paddedIndex}${prefix}${extension}`;
      
      // Attendre le chargement de l'image
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      this.frames.push(img);
    }
    return this;
  }

  // Met à jour l'animation
  update() {
    this.frameCounter++;
    if (this.frameCounter >= this.frameDelay) {
      this.frameCounter = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }
  }

  // Dessine l'image courante sur le canvas
  draw(ctx, x, y, width, height) {
    if (this.frames.length === 0) return;
    
    const img = this.frames[this.currentFrame];
    
    ctx.save();
    if (this.flipped) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      ctx.drawImage(img, x, y, width, height);
    }
    ctx.restore();
  }

  // Change la direction du sprite (gauche/droite)
  setDirection(direction) {
    this.flipped = direction === 'left';
  }
}

export default SpriteAnimation; 