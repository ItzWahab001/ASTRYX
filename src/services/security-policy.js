function classifyRisk({accountAgeDays=999,similar=false,velocity=0,threshold=20,joinLeaveBurst=0}){const velocityRatio=threshold>0?velocity/threshold:1;const score=(accountAgeDays<1?2:accountAgeDays<7?1:0)+(similar?2:0)+(velocityRatio>=1?2:velocityRatio>=0.5?1:0)+(joinLeaveBurst>=3?2:joinLeaveBurst>=1?1:0);return{score,suspicious:score>=2,critical:score>=5}}
module.exports={classifyRisk};
