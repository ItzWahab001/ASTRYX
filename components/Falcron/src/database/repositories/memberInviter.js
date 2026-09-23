// Falcron | AeroX Development
// Author: itsfizys
import { db } from '#dbManager';
import { client } from '#src/bot';

const CACHE_TTL = 60;
const CACHE_PREFIX = 'memberinviter:';
const COLLECTION = 'member_inviters';

/**
 * Data-access layer for the `member_inviters` collection.
 * Tracks which user invited which member to a guild.
 */
export class MemberInviterRepository {
        constructor() {
                this.db = db.db;
        }

        _id(guildId, userId) {
                return `${guildId}:${userId}`;
        }

        async findById(guildId, userId) {
                if (!guildId || !userId) return null;

                const cacheKey = `${CACHE_PREFIX}${this._id(guildId, userId)}`;
                const cached = await client.c.get(cacheKey);
                if (cached !== null && cached !== undefined) return cached;

                const record = await this.db.get(COLLECTION, this._id(guildId, userId));
                const result = record || null;

                if (result) {
                        await client.c.set(cacheKey, result, CACHE_TTL);
                }

                return result;
        }

        async set(guildId, userId, inviterId, joinedAt) {
                if (!guildId || !userId) return;

                const record = {
                        id: this._id(guildId, userId),
                        guildId,
                        userId,
                        inviterId: inviterId || null,
                        joinedAt: joinedAt || Date.now(),
                };

                await this.db.set(COLLECTION, record);
                await client.c.set(`${CACHE_PREFIX}${record.id}`, record, CACHE_TTL);
        }

        async findAllByInviter(guildId, inviterId) {
                if (!guildId || !inviterId) return [];
                const Model = this.db._getModel(COLLECTION);
                const docs = await Model.find({ guildId, inviterId }).lean();
                return docs.map((doc) => this.db._clean(doc));
        }

        async delete(guildId, userId) {
                if (!guildId || !userId) return;
                const Model = this.db._getModel(COLLECTION);
                await Model.deleteOne({ id: this._id(guildId, userId) });
                await client.c.del(`${CACHE_PREFIX}${this._id(guildId, userId)}`);
        }
}

/**
 * Project: Falcron
 * Author: itsfizys (Aegis)
 * Organization: AeroX Development
 * GitHub: https://github.com/AeroXDevs
 * License: Custom
 *
 * © 2026 AeroX Development. All rights reserved.
 */