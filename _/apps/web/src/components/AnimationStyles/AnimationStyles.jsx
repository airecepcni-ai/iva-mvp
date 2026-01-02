export function AnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      @keyframes float-delayed {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-30px); }
      }
      @keyframes float-slow {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-15px); }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slide-up {
        from { 
          opacity: 0;
          transform: translateY(30px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes scale-in {
        from { 
          opacity: 0;
          transform: scale(0.95);
        }
        to { 
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      .animate-float-delayed {
        animation: float-delayed 8s ease-in-out infinite;
      }
      .animate-float-slow {
        animation: float-slow 10s ease-in-out infinite;
      }
      .animate-fade-in {
        animation: fade-in 0.8s ease-out;
      }
      .animate-slide-up {
        animation: slide-up 0.6s ease-out;
      }
      .animate-slide-up-delayed {
        animation: slide-up 0.6s ease-out 0.2s backwards;
      }
      .animate-slide-up-more-delayed {
        animation: slide-up 0.6s ease-out 0.4s backwards;
      }
      .animate-scale-in {
        animation: scale-in 0.8s ease-out 0.6s backwards;
      }
    `}</style>
  );
}
