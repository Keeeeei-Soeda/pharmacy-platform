// DTOマッピング（DB/Prisma: snake_case → APIレスポンス: camelCase）
// NOTE: キーのsnake→camel変換自体は `responseCaseMiddleware` が担う。
// ここでは「リレーション名/形（pharmacy_profiles → pharmacy など）」をAPI仕様に合わせる。

function mapJobPosting(job) {
  if (!job) return null;
  const { pharmacy_profiles, ...rest } = job;
  return {
    ...rest,
    pharmacy: pharmacy_profiles || null
  };
}

function mapJobApplication(application) {
  if (!application) return null;
  const { job_postings, pharmacist_profiles, message_threads, ...rest } = application;
  const firstThread = Array.isArray(message_threads) ? message_threads[0] : null;
  return {
    ...rest,
    jobPosting: mapJobPosting(job_postings),
    pharmacist: pharmacist_profiles || null,
    messageThread: firstThread ? { id: firstThread.id } : null
  };
}

function mapWorkContract(contract) {
  if (!contract) return null;
  const { pharmacy_profiles, pharmacist_profiles, job_applications, ...rest } = contract;
  return {
    ...rest,
    pharmacy: pharmacy_profiles || null,
    pharmacist: pharmacist_profiles || null,
    application: mapJobApplication(job_applications)
  };
}

function mapMessage(message) {
  if (!message) return null;
  const { users, ...rest } = message;
  return {
    ...rest,
    sender: users || null
  };
}

function mapMessageThread(thread) {
  if (!thread) return null;
  const { job_applications, messages, _count, ...rest } = thread;
  const app = job_applications;

  return {
    ...rest,
    application: app
      ? {
          id: app.id,
          status: app.status,
          jobPosting: app.job_postings
            ? {
                id: app.job_postings.id,
                title: app.job_postings.title,
                pharmacy: app.job_postings.pharmacy_profiles
                  ? {
                      pharmacy_name: app.job_postings.pharmacy_profiles.pharmacy_name,
                      profile_image_url: app.job_postings.pharmacy_profiles.profile_image_url || null
                    }
                  : null
              }
            : null,
          pharmacist: app.pharmacist_profiles
            ? {
                id: app.pharmacist_profiles.id,
                first_name: app.pharmacist_profiles.first_name,
                last_name: app.pharmacist_profiles.last_name,
                profile_image_url: app.pharmacist_profiles.profile_image_url || null
              }
            : null
        }
      : null,
    messages: Array.isArray(messages) ? messages.map(mapMessage) : undefined,
    _count
  };
}

module.exports = {
  mapJobPosting,
  mapJobApplication,
  mapWorkContract,
  mapMessageThread,
  mapMessage,
  mapWorkSchedule
};

function mapWorkSchedule(schedule) {
  if (!schedule) return null;
  const { work_contracts, ...rest } = schedule;
  return {
    ...rest,
    contract: work_contracts
      ? {
          id: work_contracts.id,
          pharmacy: work_contracts.pharmacy_profiles || null,
          pharmacist: work_contracts.pharmacist_profiles || null
        }
      : null
  };
}


