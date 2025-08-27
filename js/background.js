document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('constellation-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    const options = {
        particleColor: "rgba(0, 255, 65, 0.7)",
        lineColor: "rgba(0, 255, 65, 0.2)",
        particleAmount: 50,
        defaultRadius: 2,
        variantRadius: 1,
        defaultSpeed: 0.5,
        variantSpeed: 0.5,
        linkRadius: 200,
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function Particle(x, y) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.radius = options.defaultRadius + Math.random() * options.variantRadius;
        this.speed = options.defaultSpeed + Math.random() * options.variantSpeed;
        this.directionAngle = Math.floor(Math.random() * 360);
        this.vector = {
            x: Math.cos(this.directionAngle) * this.speed,
            y: Math.sin(this.directionAngle) * this.speed
        };
    }

    Particle.prototype.update = function() {
        this.border();
        this.x += this.vector.x;
        this.y += this.vector.y;
    };

    Particle.prototype.border = function() {
        if (this.x >= canvas.width || this.x <= 0) {
            this.vector.x *= -1;
        }
        if (this.y >= canvas.height || this.y <= 0) {
            this.vector.y *= -1;
        }
        if (this.x > canvas.width) this.x = canvas.width;
        if (this.y > canvas.height) this.y = canvas.height;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
    };

    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = options.particleColor;
        ctx.fill();
    };

    function linkParticles(point, hubs) {
        for (let i = 0; i < hubs.length; i++) {
            let distance = getDistance(point, hubs[i]);
            let opacity = 1 - (distance / options.linkRadius);
            if (opacity > 0) {
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = `rgba(0, 255, 65, ${opacity})`;
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(hubs[i].x, hubs[i].y);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }

    function getDistance(point1, point2) {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    }

    function setup() {
        for (let i = 0; i < options.particleAmount; i++) {
            particles.push(new Particle());
        }
        window.requestAnimationFrame(loop);
    }

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        for (let i = 0; i < particles.length; i++) {
            linkParticles(particles[i], particles);
        }
        window.requestAnimationFrame(loop);
    }

    setup();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
});
