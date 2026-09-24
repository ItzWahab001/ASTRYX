import {NextResponse} from 'next/server'; import {env} from '@dynex/config';
export async function GET(){const p=new URLSearchParams({client_id:env.DISCORD_CLIENT_ID,response_type:'code',redirect_uri:env.DISCORD_REDIRECT_URI,scope:'identify guilds'});return NextResponse.redirect(`https://discord.com/oauth2/authorize?${p}`)}
