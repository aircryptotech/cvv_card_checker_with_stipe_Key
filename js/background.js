document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) {
        return;
    }
    const ctx = canvas.getContext('2d');

    // Set canvas to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Characters used in the Matrix effect
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:",.<>?';
    const charArray = characters.split('');

    const fontSize = 14;
    const columns = canvas.width / fontSize;

    // Create a drop for each column
    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }

    function draw() {
        // Fill the canvas with a semi-transparent black to create the fading effect
        ctx.fillStyle = 'rgba(13, 13, 13, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set text color and font
        ctx.fillStyle = '#00ff41'; // Primary color from CSS
        ctx.font = `${fontSize}px VT323, monospace`;

        // Loop through each drop
        for (let i = 0; i < drops.length; i++) {
            const text = charArray[Math.floor(Math.random() * charArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            // Reset drop to the top randomly after it has crossed the screen
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            // Increment the y-coordinate of the drop
            drops[i]++;
        }
    }

    const interval = setInterval(draw, 40);

    // Adjust canvas size on window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Recalculate columns and drops on resize if needed, but for simplicity, we'll just restart
        // This part can be improved for better performance
        location.reload();
    });
});
