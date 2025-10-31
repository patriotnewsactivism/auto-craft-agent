import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  strengths: string[];
}

interface ValidationReportProps {
  codeValidation?: ValidationResult;
  architectureValidation?: ValidationResult;
  securityAudit?: ValidationResult;
}

export const ValidationReport = ({
  codeValidation,
  architectureValidation,
  securityAudit
}: ValidationReportProps) => {
  const hasResults = codeValidation || architectureValidation || securityAudit;

  if (!hasResults) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-yellow-500" />
    );
  };

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-500" />
          <CardTitle>Autonomous Validation</CardTitle>
        </div>
        <CardDescription>
          AI-powered code quality, architecture, and security analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Code Quality */}
        {codeValidation && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(codeValidation.isValid)}
                <span className="font-semibold">Code Quality</span>
              </div>
              <span className={`text-lg font-bold ${getScoreColor(codeValidation.score)}`}>
                {codeValidation.score}/100
              </span>
            </div>
            <Progress value={codeValidation.score} className="h-2" />
            
            {codeValidation.strengths.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Strengths
                </div>
                {codeValidation.strengths.map((strength, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground pl-4">
                    • {strength}
                  </div>
                ))}
              </div>
            )}

            {codeValidation.issues.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <div className="font-semibold mb-1">Issues Found:</div>
                  {codeValidation.issues.map((issue, idx) => (
                    <div key={idx}>• {issue}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {codeValidation.suggestions.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium">Suggestions:</div>
                {codeValidation.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground pl-4">
                    • {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Architecture */}
        {architectureValidation && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(architectureValidation.isValid)}
                <span className="font-semibold">Architecture</span>
              </div>
              <span className={`text-lg font-bold ${getScoreColor(architectureValidation.score)}`}>
                {architectureValidation.score}/100
              </span>
            </div>
            <Progress value={architectureValidation.score} className="h-2" />
            
            {architectureValidation.strengths.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-green-600 dark:text-green-400">Strengths:</div>
                {architectureValidation.strengths.slice(0, 3).map((strength, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground pl-4">
                    • {strength}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Security */}
        {securityAudit && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(securityAudit.isValid)}
                <span className="font-semibold">Security</span>
              </div>
              <span className={`text-lg font-bold ${getScoreColor(securityAudit.score)}`}>
                {securityAudit.score}/100
              </span>
            </div>
            <Progress value={securityAudit.score} className="h-2" />
            
            {securityAudit.issues.length > 0 ? (
              <Alert variant="destructive" className="py-2">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <div className="font-semibold mb-1">Security Issues:</div>
                  {securityAudit.issues.map((issue, idx) => (
                    <div key={idx}>• {issue}</div>
                  ))}
                </AlertDescription>
              </Alert>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                No security issues detected
              </Badge>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          <Badge variant="secondary" className="mb-2">
            <Brain className="h-3 w-3 mr-1" />
            Autonomous Validation
          </Badge>
          <p>AI continuously analyzes and validates generated code for quality, security, and best practices.</p>
        </div>
      </CardContent>
    </Card>
  );
};

function Brain(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}
