// Falcron | AeroX Development
// Author: itsfizys
import { db } from '#dbManager';
import { client } from '#src/bot';

const CACHE_TTL = 15;
const CACHE_PREFIX = 'usermsgcount:';
const COLLECTION = 'user_message_counts';

/**
 * Data-access layer for the `user_message_counts` collection.
 * Tracks per-user per-guild all-time and daily message totals.
 */
export class UserMessageCounterRepository {
        constructor() {
                this.db = db.db;
        }

        _today() {
                return new Date().toISOString().slice(0, 10);
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

        async findOrCreate(guildId, userId) {
                if (!guildId || !userId) throw new Error('Invalid guildId or userId');

                let record = await this.findById(guildId, userId);

                if (!record) {
                        record = {
                                id: this._id(guildId, userId),
                                guildId,
                                userId,
                                total: 0,
                                todayCount: 0,
                                lastResetDate: this._today(),
                        };

                        await this.db.set(COLLECTION, record);
                        await client.c.set(`${CACHE_PREFIX}${record.id}`, record, CACHE_TTL);
                }

                return record;
        }

        async increment(guildId, userId) {
                if (!guildId || !userId) return;

                const record = await this.findOrCreate(guildId, userId);
                const today = this._today();

                const todayCount =
                        record.lastResetDate === today ? (record.todayCount || 0) + 1 : 1;

                const updated = {
                        ...record,
                        total: (record.total || 0) + 1,
                        todayCount,
                        lastResetDate: today,
                };

                await this.db.set(COLLECTION, updated);
                await client.c.set(`${CACHE_PREFIX}${record.id}`, updated, CACHE_TTL);
        }

        async findAllByGuild(guildId) {
                if (!guildId) return [];
                const Model = this.db._getModel(COLLECTION);
                const docs = await Model.find({ guildId })
                        .sort({ total: -1 })
                        .lean();
                return docs.map((doc) => this.db._clean(doc));
        }

        async resetCount(guildId, userId) {
                if (!guildId || !userId) return;

                const record = await this.findOrCreate(guildId, userId);

                const updated = {
                        ...record,
                        total: 0,
                        todayCount: 0,
                        lastResetDate: this._today(),
                };

                await this.db.set(COLLECTION, updated);
                await client.c.set(`${CACHE_PREFIX}${record.id}`, updated, CACHE_TTL);
        }

        async addCount(guildId, userId, amount) {
                if (!guildId || !userId || !amount || amount < 1) return;

                const record = await this.findOrCreate(guildId, userId);

                const updated = {
                        ...record,
                        total: (record.total || 0) + amount,
                };

                await this.db.set(COLLECTION, updated);
                await client.c.set(`${CACHE_PREFIX}${record.id}`, updated, CACHE_TTL);
        }

        async removeCount(guildId, userId, amount) {
                if (!guildId || !userId || !amount || amount < 1) return;

                const record = await this.findOrCreate(guildId, userId);

                const updated = {
                        ...record,
                        total: Math.max(0, (record.total || 0) - amount),
                };

                await this.db.set(COLLECTION, updated);
                await client.c.set(`${CACHE_PREFIX}${record.id}`, updated, CACHE_TTL);
        }

        async getCounts(guildId, userId) {
                const record = await this.findOrCreate(guildId, userId);
                const today = this._today();

                if (record.lastResetDate !== today) {
                        const reset = {
                                ...record,
                                todayCount: 0,
                                lastResetDate: today,
                        };
                        await this.db.set(COLLECTION, reset);
                        await client.c.set(`${CACHE_PREFIX}${record.id}`, reset, CACHE_TTL);
                        return { total: reset.total || 0, todayCount: 0 };
                }

                return {
                        total: record.total || 0,
                        todayCount: record.todayCount || 0,
                };
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