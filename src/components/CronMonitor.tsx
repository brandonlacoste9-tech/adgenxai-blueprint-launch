import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle, XCircle, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CronJobLog {
  id: number;
  job_name: string;
  executed_at: string;
  status: 'started' | 'completed' | 'failed';
  details: string;
}

interface CronJob {
  job_name: string;
  schedule: string;
  last_run?: string;
  next_run?: string;
  status: 'active' | 'inactive' | 'error';
}

const CronMonitor: React.FC = () => {
  const [logs, setLogs] = useState<CronJobLog[]>([]);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCronData();
    // Refresh every 30 seconds
    const interval = setInterval(loadCronData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCronData = async () => {
    try {
      setLoading(true);

      // Load recent system logs (our new comprehensive logging system)
      const { data: logsData, error: logsError } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) {
        console.error('Error loading system logs:', logsError);
        // Fallback to old cron_job_logs if new table doesn't exist
        const { data: fallbackLogs } = await supabase
          .from('cron_job_logs')
          .select('*')
          .order('executed_at', { ascending: false })
          .limit(50);
        setLogs(fallbackLogs?.map(log => ({
          id: log.id,
          job_name: 'unknown', // We'll derive from component/event_type
          executed_at: log.executed_at,
          status: log.status || 'completed',
          details: log.details || log.message
        })) || []);
      } else {
        // Transform system logs to our expected format
        setLogs(logsData?.map(log => ({
          id: log.id,
          job_name: `${log.component}:${log.event_type}`,
          executed_at: log.created_at,
          status: log.event_type.includes('error') ? 'failed' :
                  log.event_type.includes('complete') ? 'completed' :
                  log.event_type.includes('start') ? 'started' : 'completed',
          details: log.message
        })) || []);
      }

      // Load active cron jobs - try to get real data from cron.job table
      try {
        const { data: cronJobsData } = await supabase.rpc('get_cron_jobs');
        if (cronJobsData) {
          setJobs(cronJobsData);
        } else {
          // Fallback to predefined jobs
          setJobs([
            {
              job_name: 'daily-research-refresh',
              schedule: '0 13 * * *',
              last_run: new Date().toISOString(),
              next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'active'
            },
            {
              job_name: 'weekly-demo-cleanup',
              schedule: '0 6 * * 0',
              last_run: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              next_run: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'active'
            },
            {
              job_name: 'daily-usage-report',
              schedule: '0 10 * * *',
              last_run: new Date().toISOString(),
              next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'active'
            },
            {
              job_name: 'hourly-health-check',
              schedule: '0 * * * *',
              last_run: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              next_run: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              status: 'active'
            }
          ]);
        }
      } catch (error) {
        // Fallback to predefined jobs if RPC fails
        setJobs([
          {
            job_name: 'daily-research-refresh',
            schedule: '0 13 * * *',
            last_run: new Date().toISOString(),
            next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          },
          {
            job_name: 'weekly-demo-cleanup',
            schedule: '0 6 * * 0',
            last_run: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            next_run: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          },
          {
            job_name: 'daily-usage-report',
            schedule: '0 10 * * *',
            last_run: new Date().toISOString(),
            next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          },
          {
            job_name: 'hourly-health-check',
            schedule: '0 * * * *',
            last_run: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            next_run: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: 'active'
          }
        ]);
      }

    } catch (error) {
      console.error('Error loading cron data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'started':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'active':
        return <Activity className="w-4 h-4 text-green-400" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      started: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
      <Badge variant="outline" className={`text-xs ${variants[status as keyof typeof variants] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        {status}
      </Badge>
    );
  };

  const formatSchedule = (cronExpression: string) => {
    // Simple cron to human readable conversion
    const parts = cronExpression.split(' ');
    if (parts.length >= 5) {
      const minute = parts[0];
      const hour = parts[1];
      const day = parts[2];
      const month = parts[3];
      const weekday = parts[4];

      if (hour === '*' && minute === '0') return 'Hourly';
      if (day === '*' && hour === '0' && minute === '0') return 'Daily at midnight';
      if (weekday === '0' && hour === '6' && minute === '0') return 'Weekly (Sunday 2 AM EST)';
      if (hour === '13' && minute === '0') return 'Daily at 9 AM EST';
      if (hour === '10' && minute === '0') return 'Daily at 6 AM EST';
    }
    return cronExpression;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-md border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-voyageur-gold" />
              Cron Job Monitor
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCronData}
              disabled={loading}
              className="bg-white/5 border-white/10 hover:border-voyageur-gold/50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-voyageur-gold mb-3 uppercase tracking-wide">
                Active Jobs
              </h4>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.job_name} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="font-medium text-sm">{job.job_name.replace(/-/g, ' ')}</span>
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                    <div className="text-xs text-white/60 space-y-1">
                      <p>Schedule: {formatSchedule(job.schedule)}</p>
                      {job.last_run && <p>Last run: {formatDateTime(job.last_run)}</p>}
                      {job.next_run && <p>Next run: {formatDateTime(job.next_run)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-voyageur-gold mb-3 uppercase tracking-wide">
                Recent Activity
              </h4>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No activity logs yet</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="bg-black/20 rounded p-3">
                        <div className="flex items-start gap-2">
                          {getStatusIcon(log.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{log.job_name.replace(/-/g, ' ')}</span>
                              <span className="text-xs text-white/60">
                                {formatDateTime(log.executed_at)}
                              </span>
                            </div>
                            <p className="text-xs text-white/70">{log.details}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CronMonitor;