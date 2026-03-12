gsap.from(".hero-text h1 ", {
    y: 10,
    opacity: 0,
    duration:1,
   delay:1,
  
})
gsap.from(".hero-text p ", {
    y: -25,
    opacity: 0,
    duration:1,
   delay:1,
    stagger:1,
})

gsap.to(".btn",{
    y:10,
    opacity: 1,
    duration:1.2,
    delay:1.2,
    stagger:1,
})
gsap.from(".stat h2 ", {
    y: -25,
    opacity: 0,
    duration:1,
   delay:1,
    stagger:1,
})

 

gsap.from(".big-img ",{
     y: -30,
    opacity: 0,
    duration:0.8,
   delay:0.9,
   
})
gsap.from(".small-images img",{
     x: 30,
    opacity: 0,
    duration:0.8,
   delay:0.9,
   
})



gsap.to(".left-container img",{
    x: 320,
    duration:1.2,
    delay:0.4,
    
})


gsap.to(".Intro img",{
    x:700,
    duration:1.2,
    delay:1,
    scrollTrigger:{
        trigger:".Intro img",
        scroller:"body",
       start: "top 42%", 
       end:" bottom 40%",
        scrub:3,
       
    }
})

gsap.to(".about h1, .about p",{
    x:-700,
    duration:1.2,
    delay:1,
    scrollTrigger:{
        trigger:".about h1, .about p",
        scroller:"body",
       start: "top 52%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.from(".box h2, .box h4",{
     y: 25,
    opacity: 0,
    duration:1,
   delay:1, 
   scale:0.4,
   scrollTrigger:{
        trigger:".box h2, .box h4",
        scroller:"body",
       
       start: "top 70%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.from(".heartbeat-background",{
     y: -25,
    opacity: 0,
    duration:1,
   delay:1.3, 
    scale:0.4,
    scrollTrigger:{
        trigger:".box h2, .box h4",
        scroller:"body",
       start: "top 68%", 
        end:" bottom 30%",
        scrub:3,
}
}
)

// gsap.from(".card1", {
// x: -520,
//     opacity: 0,
//     duration:1,
//    delay:0.7, 
  
//    scrollTrigger:{
//         trigger:".card1",
//         scroller:"body",
//        start: "top 52%", 
//         end:" bottom 30%",
       
//         scrub:3,
// }
// })
// gsap.from(".card2", {
// y: 250,
//     opacity: 0,
//     duration:1,
//    delay:0.7, 
  
//    scrollTrigger:{
//         trigger:".card1",
//         scroller:"body",
//        start: "top 52%", 
//         end:" bottom 30%",
       
//         scrub:3,
// }
// })
// gsap.from(".card3", {
// x: 560,
//     opacity: 0,
//     duration:1,
//    delay:0.7, 
  
//    scrollTrigger:{
//         trigger:".card1",
//         scroller:"body",
//        start: "top 52%", 
//         end:" bottom 30%",
      
//         scrub:3,
// }
// })

gsap.to(".third h1",{
   x:1220,
    opacity: 1,
   duration:3,
    delay:0.7,
    scrollTrigger:{
       trigger:".third h1",
       scroller:"body",
       start: "top 50%", 
       end:" bottom 40%",
        scrub:2,
        }   
})

gsap.to("#heading p",{
    x:-1265,
    opacity: 1,
    duration:3,
    delay:0.7,
    scrollTrigger:{
        trigger:"#heading p",
        scroller:"body",
       start: "top 66%", 
       end:" bottom 40%",
        scrub:2,
        }   
})

gsap.from("#heading h3",{
     y: 25,
    opacity: 0,
    duration:1,
   delay:1, 
   scale:0.4,
   scrollTrigger:{
        trigger:"#heading h3",
        scroller:"body",
       start: "top 85%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.from(".cat1",{
     x: 850,
    opacity: 0,
    duration:1.2,
   delay:0.7, 
   scale:0.5,
   scrollTrigger:{
        trigger:".cat1",
        scroller:"body",
       start: "top 66%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.from(".cat2",{
     x: -850,
    opacity: 0,
    duration:1.2,
   delay:0.9, 
   scale:0.5,
   scrollTrigger:{
        trigger:".cat2",
        scroller:"body",
       start: "top 68%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.from(".cat3",{
     x: 900,
    opacity: 0,
    duration:1.2,
   delay:1.1, 
   scale:0.5,
   scrollTrigger:{
        trigger:".cat3",
        scroller:"body",
       start: "top 70%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.from(".cat4",{
     x: -850,
    opacity: 0,
    duration:1.2,
   delay:0.9, 
   scale:0.5,
   scrollTrigger:{
        trigger:".cat4",
        scroller:"body",
       start: "top 68%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.to(".contact-form",{
    x:680,
    duration:1.2,
    delay:1,
    scrollTrigger:{
        trigger:".contact-form",
        scroller:"body",
       start: "top 49%", 
       end:" bottom 40%",
        scrub:3,
       
    }
})

gsap.to(".map-image img",{
    x:-700,
    duration:1.2,
    delay:1,
    scrollTrigger:{
        trigger:".map-image img",
        scroller:"body",
       start: "top 45%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.from(".contact-section h2",{
     y: 25,
    opacity: 0,
    duration:1,
   delay:1, 
   scale:0.4,
   scrollTrigger:{
        trigger:".contact-section h2",
        scroller:"body",
       start: "top 70%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})

gsap.from(".reviews-section h2",{
     y: 25,
    opacity: 0,
    duration:1,
   delay:1, 
   scale:0.4,
   scrollTrigger:{
        trigger:".reviews-section h2",
        scroller:"body",
       start: "top 63%", 
        end:" bottom 30%",
        scrub:2,
       
    }
})

gsap.from(".reviews-cards",{
     y: 35,
    opacity: 0,
    duration:1.2,
   delay:1.1, 
   scale:0.5,
   scrollTrigger:{
        trigger:".reviews-cards",
        scroller:"body",
       start: "top 70%", 
        end:" bottom 30%",
        scrub:3,
       
    }
})