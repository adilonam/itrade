import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // eslint-disable-next-line no-console
    console.log(
      '🔄 Refresh transaction job executed at:',
      new Date().toISOString()
    );

    // Print a message for now
    const message = `Refresh transaction running at ${new Date().toLocaleString()}`;
    // eslint-disable-next-line no-console
    console.log('📢 Message:', message);

    // TODO: Add your transaction refresh logic here
    // - Fetch latest transactions
    // - Update database
    // - Process pending transactions
    // - Send notifications
    // - etc.

    return NextResponse.json({
      success: true,
      message: 'Refresh transaction job executed successfully',
      timestamp: new Date().toISOString(),
      data: message
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Refresh transaction job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Refresh transaction job failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Optional: Handle POST requests as well
export async function POST() {
  return GET();
}
